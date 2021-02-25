

def outputPath = args[0]

print outputPath

def imageData = getCurrentImageData()

double downsample = 32
int tileSize = 256
    
new TileExporter(imageData)
    .downsample(downsample)     // Define export resolution
    .imageExtension('.png')     // Define file extension for original pixels (often .tif, .jpg, '.png' or '.ome.tif')
    .tileSize(tileSize)              // Define size of each tile, in pixels
    // .labeledServer(epithelialLayerLabelServer) // Define the labeled image server to use (i.e. the one we just built)
    // .annotatedTilesOnly(annotatedOnly)  // If true, only export tiles if there is a (labeled) annotation present
    .overlap(0)                // Define overlap, in pixel units at the export resolution
    .writeTiles(outputPath)     // Write tiles to the specified directory
