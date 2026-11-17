// Erzeugt die App-Icons: swift tools/make-icons.swift
import AppKit
func render(_ size: Int, _ path: String) {
  let s = CGFloat(size)
  let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
  let g = NSGradient(colors: [NSColor(red:0.26,green:0.22,blue:0.79,alpha:1), NSColor(red:0.49,green:0.23,blue:0.93,alpha:1), NSColor(red:0.86,green:0.15,blue:0.47,alpha:1)])!
  g.draw(in: NSRect(x:0,y:0,width:s,height:s), angle: -50)
  let star = NSAttributedString(string: "⭐", attributes: [.font: NSFont.systemFont(ofSize: s*0.16)])
  star.draw(at: NSPoint(x: s*0.68, y: s*0.70))
  let owl = NSAttributedString(string: "🦉", attributes: [.font: NSFont.systemFont(ofSize: s*0.56)])
  let sz = owl.size()
  owl.draw(at: NSPoint(x: (s-sz.width)/2, y: (s-sz.height)/2 - s*0.03))
  NSGraphicsContext.restoreGraphicsState()
  try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: path))
}
render(192, "icons/icon-192.png"); render(512, "icons/icon-512.png"); render(180, "icons/apple-touch-icon.png")
