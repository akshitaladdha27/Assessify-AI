# Create a new build stage from a base image.
FROM node:24-alpine
# apline - sabse choti, lightweight aur super-fast Linux image.

# Change working directory.
# Container ke andar 'app' naam ka folder banakar usme enter kar gaye
# cd app
WORKDIR /app

# Copy files and directories.
COPY package*.json ./

# Execute build commands.
RUN npm install --legacy-peer-deps

COPY . .

# Describe which ports your application is listening on.
# Vite/React ka default port container me open kar rahe hain
EXPOSE 5173

# Specify default commands.
CMD ["npm", "run", "dev"]