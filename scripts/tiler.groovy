
// invocation
//   qupath script --image [image] tiler.groovy
// args via stdin (newline separated):
//   [tile size]
//   [N]
//   [output folder path 1]
//   [downsampling amount 1]
//   ...
//   [output folder path N]
//   [downsampling amount N]

def stdinReader = System.in.newReader()
int tileSize = stdinReader.readLine() as int
int numDownsamplings = stdinReader.readLine() as int

def imageData = getCurrentImageData()

for (int i = 0; i < numDownsamplings; i++) {
    String outputPath = stdinReader.readLine()
    int downsampling = stdinReader.readLine() as int

    new TileExporter(imageData)
        .downsample(downsampling)
        .imageExtension('.png')
        .tileSize(tileSize)
        .overlap(0)
        .writeTiles(outputPath)
}
