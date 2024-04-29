# Use an official Node.js runtime as the base image
FROM node:20.5.1-bookworm-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of application code to the working directory
COPY . .

# Expose the port app runs on
EXPOSE 3000

# Command to run application
CMD ["node", "backend/server.js"]
