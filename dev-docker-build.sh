
echo "Compiling and packing frontend (into backend folders)..."

(cd frontend || exit; npm run build:prod)

echo "Compiling backend (HTML/some API) and building Docker image..."

(cd backend-html || exit; npm run build)
(cd backend-html || exit; docker build -t backend-html .)

# echo "Compiling Graphql backend and building Docker image..."
# (cd backend-graphql; npm run build)
# (cd backend-graphql || exit; docker build -t backend-graphql .)
