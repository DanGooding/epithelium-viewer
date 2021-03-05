
// invocation
// qupath script --image [image], --args [arguments as a single string] tiler.groovy

// args: [tile size] [downsampling] [output folder path]

def stdinReader = System.in.newReader()

def tileSize = stdinReader.readLine() as int
def downsampling = stdinReader.readLine() as int
def outputPath = stdinReader.readLine()

def imageData = getCurrentImageData()

new TileExporter(imageData)
    .downsample(downsampling)     // Define export resolution
    .imageExtension('.png')     // Define file extension for original pixels (often .tif, .jpg, '.png' or '.ome.tif')
    .tileSize(tileSize)         // Define size of each tile, in pixels
    .overlap(0)                 // Define overlap, in pixel units at the export resolution
    .writeTiles(outputPath)     // Write tiles to the specified directory
