
// invocation
//  qupath script --image [image] tiler.groovy
// args via stdin (newline separated):
//  [tile size]
//  [output folder path]
//  [number of downsampling levels]
//  [downsampling amount 1]
//  [downsampling amount 2]
//  ...

def stdinReader = System.in.newReader()
int tileSize = stdinReader.readLine() as int
String outputPath = stdinReader.readLine()
int numDownsamplings = stdinReader.readLine() as int

def imageData = getCurrentImageData()

for (int i = 0; i < numDownsamplings; i++) {
    int downsampling = stdinReader.readLine() as int
    
    new TileExporter(imageData)
        .downsample(downsampling)
        .imageExtension('.png')
        .tileSize(tileSize)
        .overlap(0)
        .writeTiles(outputPath)
}
