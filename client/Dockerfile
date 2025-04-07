# Use Node.js to build the frontend
FROM node:18 AS frontend-build

WORKDIR /app

# Copy frontend source code and install dependencies
COPY package.json package-lock.json ./

RUN npm ci

COPY . .

# Build the frontend (with environment variables)
ARG VITE_BACKEND_URL
ARG VITE_GOOGLE_API
ARG VITE_GOOGLE_API_KEY
ARG VITE_SERVICE_KEY

ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_GOOGLE_API=${VITE_GOOGLE_API}
ENV VITE_GOOGLE_API_KEY=${VITE_GOOGLE_API_KEY}
ENV VITE_SERVICE_KEY=${VITE_SERVICE_KEY}

RUN npm run build

# Final image with Node.js and serve to serve the frontend
FROM node:18-slim

WORKDIR /app

# Install 'serve' globally to serve static files
RUN npm install -g serve

# Copy the package.json and package-lock.json from the build stage
COPY --from=frontend-build /app/package.json /app/package-lock.json /app/

# Copy only the built application from the previous stage
COPY --from=frontend-build /app/dist /app/dist

# Expose the port for serving the frontend
EXPOSE 5173

# Start the frontend using 'serve'
CMD ["serve", "-s", "dist", "-l", "5173"]