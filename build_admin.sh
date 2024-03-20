# Check for required Node.js and npm
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "Node.js and npm are required. Please install them."
    exit 1
fi

# Get API key (check environment variable first, then argument)
API_KEY=${API_KEY:-$1}

if [[ -z "$API_KEY" ]]; then
    echo "Error: API key missing. Please provide it as an environment variable or argument."
    exit 1
fi

# Create a temporary working directory
WORKDIR=$(mktemp -d)
echo "Temporary working directory created at: $WORKDIR"

# Define function to clean up the temporary directory on script exit
function cleanup {
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

# Copy source and demo files into temp WORKDIR (adjust paths as needed)
cp -r ./src/* "$WORKDIR"
cp -r ./demo/src "$WORKDIR/demo"

cd "$WORKDIR" || exit 1 # Move into the WORKDIR

# API Key replacement in 'src/env.js'
cp env.example.js env.js

echo "API key updated in env.js"

sed -i -r "s/<API_KEY>/${API_KEY}/g" env.js
echo "index.html modified"

# Modify index.html (assuming it's in the top level of WORKDIR)
sed -i -r "s/main.js/demo\/config-panel.js/g" index.html

# Start the server using npx (no need for pre-installation)
npx http-server -p 5500 .  # Server starts within the temp WORKDIR