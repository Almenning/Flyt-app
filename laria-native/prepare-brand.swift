import AppKit
import Foundation
import CoreGraphics

enum BrandError: Error { case context }

let fm = FileManager.default
let root = URL(fileURLWithPath: fm.currentDirectoryPath)
let appAssets = root.appendingPathComponent("ios/App/App/Assets.xcassets")
let iconURL = appAssets.appendingPathComponent("AppIcon.appiconset/AppIcon-512@2x.png")
let splashDir = appAssets.appendingPathComponent("Splash.imageset")

func bitmap(width: Int, height: Int, draw: (CGContext, CGRect) -> Void) throws -> Data {
    guard let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: width,
        pixelsHigh: height,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    ), let graphics = NSGraphicsContext(bitmapImageRep: rep) else { throw BrandError.context }

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = graphics
    let ctx = graphics.cgContext
    let rect = CGRect(x: 0, y: 0, width: width, height: height)
    draw(ctx, rect)
    NSGraphicsContext.restoreGraphicsState()

    guard let data = rep.representation(using: .png, properties: [:]) else { throw BrandError.context }
    return data
}

func roundedRect(_ ctx: CGContext, _ rect: CGRect, radius: CGFloat, color: CGColor) {
    ctx.setFillColor(color)
    ctx.addPath(CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil))
    ctx.fillPath()
}

func drawSparkle(_ ctx: CGContext, center: CGPoint, radius: CGFloat) {
    let path = CGMutablePath()
    let points: [CGPoint] = [
        CGPoint(x: center.x, y: center.y + radius),
        CGPoint(x: center.x + radius * 0.27, y: center.y + radius * 0.27),
        CGPoint(x: center.x + radius, y: center.y),
        CGPoint(x: center.x + radius * 0.27, y: center.y - radius * 0.27),
        CGPoint(x: center.x, y: center.y - radius),
        CGPoint(x: center.x - radius * 0.27, y: center.y - radius * 0.27),
        CGPoint(x: center.x - radius, y: center.y),
        CGPoint(x: center.x - radius * 0.27, y: center.y + radius * 0.27)
    ]
    path.move(to: points[0])
    for p in points.dropFirst() { path.addLine(to: p) }
    path.closeSubpath()
    ctx.setFillColor(CGColor(red: 1.0, green: 0.82, blue: 0.31, alpha: 1))
    ctx.addPath(path)
    ctx.fillPath()
}

func drawLariaMark(_ ctx: CGContext, rect: CGRect, includeBackground: Bool) {
    let w = rect.width, h = rect.height, s = min(w, h)
    let cream = CGColor(red: 1.0, green: 0.969, blue: 0.91, alpha: 1)
    if includeBackground {
        ctx.setFillColor(cream)
        ctx.fill(rect)
    }

    let center = CGPoint(x: rect.midX, y: rect.midY + s * 0.025)
    let globeR = s * 0.30
    let globeRect = CGRect(x: center.x - globeR, y: center.y - globeR, width: globeR * 2, height: globeR * 2)

    ctx.saveGState()
    ctx.addEllipse(in: globeRect)
    ctx.clip()
    let colors = [
        CGColor(red: 0.34, green: 0.49, blue: 0.95, alpha: 1),
        CGColor(red: 0.55, green: 0.42, blue: 0.91, alpha: 1)
    ] as CFArray
    let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0,1])!
    ctx.drawLinearGradient(
        gradient,
        start: CGPoint(x: globeRect.minX, y: globeRect.maxY),
        end: CGPoint(x: globeRect.maxX, y: globeRect.minY),
        options: []
    )

    ctx.setStrokeColor(CGColor(gray: 1, alpha: 0.95))
    ctx.setLineWidth(s * 0.047)
    ctx.setLineCap(.round)

    ctx.move(to: CGPoint(x: center.x - globeR * 0.80, y: center.y))
    ctx.addLine(to: CGPoint(x: center.x + globeR * 0.80, y: center.y))
    ctx.strokePath()

    ctx.addEllipse(in: CGRect(x: center.x - globeR * 0.66, y: center.y - globeR, width: globeR * 1.32, height: globeR * 2))
    ctx.strokePath()

    ctx.addEllipse(in: CGRect(x: center.x - globeR, y: center.y - globeR * 0.48, width: globeR * 2, height: globeR * 0.96))
    ctx.strokePath()
    ctx.restoreGState()

    drawSparkle(ctx, center: CGPoint(x: center.x + globeR * 0.84, y: center.y + globeR * 0.88), radius: s * 0.072)
}

let icon = try bitmap(width: 1024, height: 1024) { ctx, rect in
    let bg = CGColor(red: 1.0, green: 0.969, blue: 0.91, alpha: 1)
    ctx.setFillColor(bg)
    ctx.fill(rect)
    drawLariaMark(ctx, rect: rect, includeBackground: false)
}
try fm.createDirectory(at: iconURL.deletingLastPathComponent(), withIntermediateDirectories: true)
try icon.write(to: iconURL)

let splash = try bitmap(width: 2732, height: 2732) { ctx, rect in
    ctx.setFillColor(CGColor(red: 1.0, green: 0.969, blue: 0.91, alpha: 1))
    ctx.fill(rect)
    let markSize = rect.width * 0.62
    let markRect = CGRect(x: (rect.width - markSize) / 2, y: (rect.height - markSize) / 2 + rect.height * 0.03, width: markSize, height: markSize)
    drawLariaMark(ctx, rect: markRect, includeBackground: false)

    let title = NSAttributedString(
        string: "Læria",
        attributes: [
            .font: NSFont.systemFont(ofSize: 210, weight: .heavy),
            .foregroundColor: NSColor(calibratedRed: 0.12, green: 0.23, blue: 0.38, alpha: 1)
        ]
    )
    let size = title.size()
    title.draw(at: NSPoint(x: (rect.width - size.width) / 2, y: rect.height * 0.19))
}
try fm.createDirectory(at: splashDir, withIntermediateDirectories: true)
for name in ["splash-2732x2732.png","splash-2732x2732-1.png","splash-2732x2732-2.png"] {
    try splash.write(to: splashDir.appendingPathComponent(name))
}

print("Installed Læria app icon and splash assets")
