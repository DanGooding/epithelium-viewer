
// invocation
// qupath script --image [image], --args [arguments as a single string] tiler.groovy

// args: [tile size] [downsampling] [output folder path]

def tileSize = args[0] as int
def downsampling = args[1] as int
def outputPath = args[2]

def imageData = getCurrentImageData()

new TileExporter(imageData)
    .downsample(downsampling)     // Define export resolution
    .imageExtension('.png')     // Define file extension for original pixels (often .tif, .jpg, '.png' or '.ome.tif')
    .tileSize(tileSize)         // Define size of each tile, in pixels
    .overlap(0)                 // Define overlap, in pixel units at the export resolution
    .writeTiles(outputPath)     // Write tiles to the specified directory
