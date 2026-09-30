FROM eclipse-temurin:22-jdk AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN apt-get update \
    && apt-get install -y maven \
    && mvn clean package -DskipTests \
    && rm -rf /var/lib/apt/lists/*

FROM eclipse-temurin:22-jre

WORKDIR /app

# Copy the built JAR. If the JAR has a different name, adjust the filename accordingly.
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
