# Use Maven to build the backend
FROM maven:3.9.6-eclipse-temurin-17 AS backend-build

WORKDIR /app

# Copy pom.xml and backend source code
COPY pom.xml .
COPY src ./src

# Build the backend JAR file and skip maven tests
RUN mvn clean install -DskipTests

# Final image (alpine with Java runtime)
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Set environment variables from the start command
ENV SPRING_FRONTEND_URL=${SPRING_FRONTEND_URL}
ENV POSTGRES_URL=${POSTGRES_URL}
ENV POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
ENV POSTGRES_USERNAME=${POSTGRES_USERNAME}
ENV SERVICE_KEY=${SERVICE_KEY}

# Copy the backend JAR file from the build stage
COPY --from=backend-build /app/target/match-me-0.0.1-SNAPSHOT.jar /app/matchme.jar

# Expose the necessary port for backend
EXPOSE 8080

# Run the backend
ENTRYPOINT ["java", "-jar", "/app/matchme.jar"]