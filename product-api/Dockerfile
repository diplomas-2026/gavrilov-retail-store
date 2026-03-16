FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

# GigaChat использует TLS-цепочку, которая может не проходить в дефолтном truststore.
# Импортируем корневой и промежуточный сертификаты Минцифры в Java cacerts на этапе сборки.
ARG GIGACHAT_CA_ROOT_URL="https://gu-st.ru/content/lending/russian_trusted_root_ca_pem.crt"
ARG GIGACHAT_CA_SUB_URL="https://gu-st.ru/content/lending/russian_trusted_sub_ca_pem.crt"
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates curl; \
    rm -rf /var/lib/apt/lists/*; \
    cp "$JAVA_HOME/lib/security/cacerts" /tmp/cacerts; \
    curl -fsSL "$GIGACHAT_CA_ROOT_URL" -o /tmp/russian_trusted_root_ca.crt; \
    curl -fsSL "$GIGACHAT_CA_SUB_URL" -o /tmp/russian_trusted_sub_ca.crt; \
    keytool -importcert -noprompt -storepass changeit -keystore /tmp/cacerts -alias russian_trusted_root_ca -file /tmp/russian_trusted_root_ca.crt; \
    keytool -importcert -noprompt -storepass changeit -keystore /tmp/cacerts -alias russian_trusted_sub_ca -file /tmp/russian_trusted_sub_ca.crt; \
    rm -f /tmp/russian_trusted_root_ca.crt /tmp/russian_trusted_sub_ca.crt

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/target/product-api-0.0.1-SNAPSHOT.jar app.jar
COPY --from=build /tmp/cacerts $JAVA_HOME/lib/security/cacerts
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
