#!/usr/bin/env python3
"""Add simulator-only QA targets to a local Xcode checkout, never to the app target.

Run after cap:sync. This changes only local project metadata; no test hooks or
credentials are compiled into the shipping app. Repeated runs are idempotent.
"""
from pathlib import Path
import hashlib
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / 'ios/App/App.xcodeproj/project.pbxproj'
APP_ID = '504EC3031FED79650016851F'
PROJECT_ID = '504EC2FC1FED79650016851F'
MARKER = '/* HverdagsOss generated simulator QA targets */'


def uid(value):
    return hashlib.sha256(('hverdagsoss-native-qa:' + value).encode()).hexdigest()[:24].upper()


def encode(value):
    if isinstance(value, dict):
        return '{ ' + ' '.join(f'{encode(k)} = {encode(v)};' for k, v in value.items()) + ' }'
    if isinstance(value, list):
        return '(' + ', '.join(encode(v) for v in value) + (',' if value else '') + ')'
    return json.dumps(str(value))


def build_objects():
    objects = {}
    for name, ui in [('NativeRuntimeTests', False), ('NativeFlowUITests', True)]:
        ids = {key: uid(name + ':' + key) for key in (
            'target', 'product', 'source', 'source-build', 'sources', 'frameworks',
            'resources', 'debug', 'release', 'configs', 'dependency', 'proxy')}
        objects[ids['source']] = {'isa': 'PBXFileReference', 'lastKnownFileType': 'sourcecode.swift',
                                  'path': f'NativeQATests/{name}.swift', 'sourceTree': 'SOURCE_ROOT'}
        objects[ids['source-build']] = {'isa': 'PBXBuildFile', 'fileRef': ids['source']}
        objects[ids['product']] = {'isa': 'PBXFileReference', 'explicitFileType': 'wrapper.cfbundle',
                                   'includeInIndex': '0', 'path': name + '.xctest', 'sourceTree': 'BUILT_PRODUCTS_DIR'}
        for key, kind, files in [('sources', 'PBXSourcesBuildPhase', [ids['source-build']]),
                                  ('frameworks', 'PBXFrameworksBuildPhase', []),
                                  ('resources', 'PBXResourcesBuildPhase', [])]:
            objects[ids[key]] = {'isa': kind, 'buildActionMask': '2147483647',
                                 'files': files, 'runOnlyForDeploymentPostprocessing': '0'}
        settings = {'PRODUCT_NAME': '$(TARGET_NAME)', 'PRODUCT_BUNDLE_IDENTIFIER': 'no.adspire.hverdagsoss.' + name,
                    'GENERATE_INFOPLIST_FILE': 'YES', 'SWIFT_VERSION': '5.0',
                    'IPHONEOS_DEPLOYMENT_TARGET': '16.4', 'TARGETED_DEVICE_FAMILY': '1,2',
                    'SDKROOT': 'iphoneos', 'CODE_SIGN_STYLE': 'Automatic',
                    'LD_RUNPATH_SEARCH_PATHS': ['$(inherited)', '@executable_path/Frameworks', '@loader_path/Frameworks']}
        if ui:
            settings['TEST_TARGET_NAME'] = 'App'
        else:
            settings['TEST_HOST'] = '$(BUILT_PRODUCTS_DIR)/App.app/App'
            settings['BUNDLE_LOADER'] = '$(TEST_HOST)'
        for key, config in [('debug', 'Debug'), ('release', 'Release')]:
            objects[ids[key]] = {'isa': 'XCBuildConfiguration', 'name': config, 'buildSettings': dict(settings)}
        objects[ids['configs']] = {'isa': 'XCConfigurationList', 'buildConfigurations': [ids['debug'], ids['release']],
                                   'defaultConfigurationIsVisible': '0', 'defaultConfigurationName': 'Debug'}
        objects[ids['proxy']] = {'isa': 'PBXContainerItemProxy', 'containerPortal': PROJECT_ID,
                                 'proxyType': '1', 'remoteGlobalIDString': APP_ID, 'remoteInfo': 'App'}
        objects[ids['dependency']] = {'isa': 'PBXTargetDependency', 'target': APP_ID, 'targetProxy': ids['proxy']}
        objects[ids['target']] = {'isa': 'PBXNativeTarget', 'name': name, 'productName': name,
                                  'productReference': ids['product'], 'buildConfigurationList': ids['configs'],
                                  'buildPhases': [ids['sources'], ids['frameworks'], ids['resources']],
                                  'buildRules': [], 'dependencies': [ids['dependency']],
                                  'productType': 'com.apple.product-type.bundle.ui-testing' if ui else 'com.apple.product-type.bundle.unit-test'}
    return objects


def buildable(parent, name, target, product):
    return ET.SubElement(parent, 'BuildableReference', BuildableIdentifier='primary', BlueprintIdentifier=target,
                         BuildableName=product, BlueprintName=name, ReferencedContainer='container:App.xcodeproj')


def scheme_xml():
    scheme = ET.Element('Scheme', LastUpgradeVersion='2600', version='1.3')
    build = ET.SubElement(scheme, 'BuildAction', parallelizeBuildables='YES', buildImplicitDependencies='YES')
    entries = ET.SubElement(build, 'BuildActionEntries')
    targets = [('App', APP_ID, 'App.app')] + [(n, uid(n + ':target'), n + '.xctest') for n in ('NativeRuntimeTests', 'NativeFlowUITests')]
    for name, target, product in targets:
        entry = ET.SubElement(entries, 'BuildActionEntry', buildForTesting='YES', buildForRunning='NO',
                              buildForProfiling='NO', buildForArchiving='NO', buildForAnalyzing='YES')
        buildable(entry, name, target, product)
    action = ET.SubElement(scheme, 'TestAction', buildConfiguration='Debug',
                           selectedDebuggerIdentifier='Xcode.DebuggerFoundation.Debugger.LLDB',
                           selectedLauncherIdentifier='Xcode.IDEFoundation.Launcher.LLDB',
                           shouldUseLaunchSchemeArgsEnv='YES')
    buildable(ET.SubElement(action, 'MacroExpansion'), 'App', APP_ID, 'App.app')
    tests = ET.SubElement(action, 'Testables')
    for name, target, product in targets[1:]:
        buildable(ET.SubElement(tests, 'TestableReference', skipped='NO', parallelizable='NO'), name, target, product)
    ET.indent(scheme)
    return ET.tostring(scheme, encoding='unicode', xml_declaration=True) + '\n'


def main():
    source = PROJECT.read_text()
    if MARKER not in source:
        objects = build_objects()
        if any(key in source for key in objects):
            raise RuntimeError('QA object identifier collision')
        if len(re.findall(r'\btargets = \(', source)) != 1:
            raise RuntimeError('Unexpected Xcode project structure')
        source = source.replace('targets = (', 'targets = (\n' + ''.join(
            '\t\t\t\t' + uid(name + ':target') + ',\n' for name in ('NativeRuntimeTests', 'NativeFlowUITests')), 1)
        end = '\t};\n\trootObject = '
        if source.count(end) != 1:
            raise RuntimeError('Cannot locate Xcode objects boundary')
        additions = MARKER + '\n' + '\n'.join(f'\t\t{key} = {encode(value)};' for key, value in objects.items()) + '\n'
        PROJECT.write_text(source.replace(end, additions + end, 1))
    scheme = PROJECT.parent / 'xcshareddata/xcschemes/NativeQA.xcscheme'
    scheme.parent.mkdir(parents=True, exist_ok=True)
    scheme.write_text(scheme_xml())
    print('NativeQA targets prepared in the local checkout; shipping App sources are unchanged.')


if __name__ == '__main__':
    main()
