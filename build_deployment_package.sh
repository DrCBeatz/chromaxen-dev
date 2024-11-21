# build_deployment_package.sh - Build the deployment package for the Lambda function

# Remove old build artifacts
rm -rf backend/__pycache__
rm lambda_function_payload.zip

# Rebuild using Docker
docker run --rm -v "$(pwd)/backend:/app" amazon/aws-sam-cli-build-image-python3.9 bash -c "\
    pip install -r /app/requirements.txt -t /tmp/build; \
    cp -r /tmp/build/* /app/; \
"

# Create the ZIP package
cd backend
zip -r ../lambda_function_payload.zip . -x "*.pyc" "__pycache__/*"
cd ..
