import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root=resolve(process.cwd());
const appDir=join(root,'ios','App','App');
const project=join(root,'ios','App','App.xcodeproj','project.pbxproj');
const storyboard=join(appDir,'Base.lproj','Main.storyboard');

const storeSwift="import Foundation\nimport Capacitor\nimport StoreKit\n\n@objc(LariaStorePlugin)\npublic class LariaStorePlugin: CAPPlugin, CAPBridgedPlugin {\n    public let identifier = \"LariaStorePlugin\"\n    public let jsName = \"LariaStore\"\n    public let pluginMethods: [CAPPluginMethod] = [\n        CAPPluginMethod(name: \"getProducts\", returnType: CAPPluginReturnPromise),\n        CAPPluginMethod(name: \"getEntitlement\", returnType: CAPPluginReturnPromise),\n        CAPPluginMethod(name: \"purchase\", returnType: CAPPluginReturnPromise),\n        CAPPluginMethod(name: \"restore\", returnType: CAPPluginReturnPromise)\n    ]\n\n    private let productIDs = [\n        \"no.adspire.laria.monthly\",\n        \"no.adspire.laria.yearly\"\n    ]\n\n    private func entitlementSnapshot() async -> (Bool, [String]) {\n        var active: [String] = []\n        for await result in Transaction.currentEntitlements {\n            guard case .verified(let transaction) = result else { continue }\n            guard productIDs.contains(transaction.productID) else { continue }\n            active.append(transaction.productID)\n        }\n        return (!active.isEmpty, active.sorted())\n    }\n\n    @objc func getProducts(_ call: CAPPluginCall) {\n        Task {\n            do {\n                let products = try await Product.products(for: productIDs)\n                let payload: JSArray = products.sorted { $0.price < $1.price }.map { product in\n                    var item = JSObject()\n                    item[\"id\"] = product.id\n                    item[\"displayName\"] = product.displayName\n                    item[\"description\"] = product.description\n                    item[\"displayPrice\"] = product.displayPrice\n                    if let period = product.subscription?.subscriptionPeriod {\n                        item[\"periodValue\"] = period.value\n                        item[\"periodUnit\"] = String(describing: period.unit)\n                    }\n                    return item\n                }\n                let (active, activeIDs) = await entitlementSnapshot()\n                call.resolve([\n                    \"products\": payload,\n                    \"active\": active,\n                    \"activeProductIds\": activeIDs\n                ])\n            } catch {\n                call.reject(\"Kunne ikke hente abonnementene fra App Store.\", nil, error)\n            }\n        }\n    }\n\n    @objc func getEntitlement(_ call: CAPPluginCall) {\n        Task {\n            let (active, activeIDs) = await entitlementSnapshot()\n            call.resolve([\n                \"active\": active,\n                \"activeProductIds\": activeIDs\n            ])\n        }\n    }\n\n    @objc func purchase(_ call: CAPPluginCall) {\n        guard let productID = call.getString(\"productId\"), productIDs.contains(productID) else {\n            call.reject(\"Ugyldig produkt.\")\n            return\n        }\n\n        Task {\n            do {\n                guard let product = try await Product.products(for: [productID]).first else {\n                    call.reject(\"Abonnementet er ikke tilgjengelig i App Store ennå.\")\n                    return\n                }\n\n                let result = try await product.purchase()\n                switch result {\n                case .success(let verification):\n                    switch verification {\n                    case .verified(let transaction):\n                        await transaction.finish()\n                        let (active, activeIDs) = await entitlementSnapshot()\n                        call.resolve([\n                            \"status\": \"purchased\",\n                            \"active\": active,\n                            \"activeProductIds\": activeIDs\n                        ])\n                    case .unverified(_, let error):\n                        call.reject(\"App Store-kjøpet kunne ikke verifiseres.\", nil, error)\n                    }\n                case .pending:\n                    call.resolve([\"status\": \"pending\", \"active\": false])\n                case .userCancelled:\n                    call.resolve([\"status\": \"cancelled\", \"active\": false])\n                @unknown default:\n                    call.reject(\"Ukjent svar fra App Store.\")\n                }\n            } catch {\n                call.reject(\"Kjøpet kunne ikke fullføres.\", nil, error)\n            }\n        }\n    }\n\n    @objc func restore(_ call: CAPPluginCall) {\n        Task {\n            do {\n                try await AppStore.sync()\n                let (active, activeIDs) = await entitlementSnapshot()\n                call.resolve([\n                    \"status\": \"restored\",\n                    \"active\": active,\n                    \"activeProductIds\": activeIDs\n                ])\n            } catch {\n                call.reject(\"Kunne ikke gjenopprette kjøp.\", nil, error)\n            }\n        }\n    }\n}\n";
const bridgeSwift="import UIKit\nimport Capacitor\n\nclass LariaBridgeViewController: CAPBridgeViewController {\n    override open func capacitorDidLoad() {\n        bridge?.registerPluginInstance(LariaStorePlugin())\n    }\n}\n";

writeFileSync(join(appDir,'LariaStorePlugin.swift'),storeSwift);
writeFileSync(join(appDir,'LariaBridgeViewController.swift'),bridgeSwift);

let board=readFileSync(storyboard,'utf8');
board=board.replace(
  'customClass="CAPBridgeViewController" customModule="Capacitor"',
  'customClass="LariaBridgeViewController" customModule="App" customModuleProvider="target"'
);
if(!board.includes('customClass="LariaBridgeViewController"'))throw new Error('Could not install Laria bridge view controller');
writeFileSync(storyboard,board);

let pbx=readFileSync(project,'utf8');
if(!pbx.includes('LariaStorePlugin.swift in Sources')){
  const buildEntries=[
    '\t\tA18000000000000000000001 /* LariaStorePlugin.swift in Sources */ = {isa = PBXBuildFile; fileRef = A18000000000000000000002 /* LariaStorePlugin.swift */; };',
    '\t\tA18000000000000000000003 /* LariaBridgeViewController.swift in Sources */ = {isa = PBXBuildFile; fileRef = A18000000000000000000004 /* LariaBridgeViewController.swift */; };'
  ].join('\n')+'\n';
  pbx=pbx.replace('/* End PBXBuildFile section */',buildEntries+'/* End PBXBuildFile section */');

  const refEntries=[
    '\t\tA18000000000000000000002 /* LariaStorePlugin.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LariaStorePlugin.swift; sourceTree = "<group>"; };',
    '\t\tA18000000000000000000004 /* LariaBridgeViewController.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = LariaBridgeViewController.swift; sourceTree = "<group>"; };'
  ].join('\n')+'\n';
  pbx=pbx.replace('/* End PBXFileReference section */',refEntries+'/* End PBXFileReference section */');

  const appGroup=/([A-F0-9]{24} \/\* App \*\/ = \{\s+isa = PBXGroup;\s+children = \(\s*)/;
  if(!appGroup.test(pbx))throw new Error('Could not find App PBXGroup');
  pbx=pbx.replace(appGroup,'$1\t\t\t\tA18000000000000000000002 /* LariaStorePlugin.swift */,\n\t\t\t\tA18000000000000000000004 /* LariaBridgeViewController.swift */,\n');

  const sourceStart='/* Begin PBXSourcesBuildPhase section */';
  const sourcePos=pbx.indexOf(sourceStart);
  if(sourcePos<0)throw new Error('Could not find PBXSourcesBuildPhase');
  const filesPos=pbx.indexOf('files = (',sourcePos);
  if(filesPos<0)throw new Error('Could not find Sources files list');
  const insertPos=pbx.indexOf('\n',filesPos)+1;
  pbx=pbx.slice(0,insertPos)
    +'\t\t\t\tA18000000000000000000001 /* LariaStorePlugin.swift in Sources */,\n'
    +'\t\t\t\tA18000000000000000000003 /* LariaBridgeViewController.swift in Sources */,\n'
    +pbx.slice(insertPos);
}
writeFileSync(project,pbx);
console.log('Installed Laria StoreKit 2 bridge into generated iOS project');
