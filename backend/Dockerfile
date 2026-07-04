# Create a new build stage from a base image.
FROM node:24-alpine

# Change working directory.
WORKDIR /app

# Copy files and directories.
COPY package*.json ./

# Execute build commands.
RUN npm install --legacy-peer-deps

COPY . .

# Describe which ports your application is listening on.
EXPOSE 5000

# Specify default commands.
CMD ["npm", "run", "dev"]