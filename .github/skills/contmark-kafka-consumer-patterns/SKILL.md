---
name: contmark-kafka-consumer-patterns
description: Kafka patterns — KafkaReceiver/Sender, Avro + Schema Registry, routing, shared topics, backward compat. Load for Kafka/.avsc work.
---

# Kafka Consumer & Producer Patterns

Reactive Kafka · Avro · Spring Boot

---

## Topic Ownership

> Schema owner = topic owner. Never produce to a topic you don't own.

| Scenario | Producer | Consumer | Routing |
|----------|----------|----------|---------|
| Dedicated | Owner service | Any downstream | No filter needed |
| Shared | Source repo only | Source repo + downstream | Filter on `receiver` field |

---

## Sender / Receiver Fields

Every Avro schema carries `sender` (producer team) and `receiver` (target team or `*` for broadcast).

**Shared topic**
Producer → set `sender` + `receiver` · absent/null → derive from topic contract · never assume.
Consumer → `receiver == myTeam | *` → process · other team → ack & skip · absent/null → derive from topic contract · never process unconfirmed.

**Dedicated topic** → single consumer · no receiver filtering.

---

## Naming

Base = schema name minus `Event` suffix. `BookingConfirmedEvent` → `BookingConfirmed`:

| | Consumer | Producer |
|-|----------|----------|
| Class | `{Base}Consumer` | `{Base}Producer` |
| Config | `{Base}KafkaConsumerConfig` | `{Base}KafkaProducerConfig` |
| Bean | `{camelBase}KafkaReceiver` | `{camelBase}KafkaSender` |
| Topic key | `spring.kafka.consumer.topics.{kebab}` | `spring.kafka.producer.topics.{kebab}` |
| Mapper | `{Schema}Mapper` (shared) | same |
| Package | `events/consumer/` | `events/producer/` |

---

## Consumer

```java
@Service @RequiredArgsConstructor @Slf4j
public class ExampleConsumer {
    private final KafkaReceiver<String, ExampleEvent> kafkaReceiver;
    private final ExampleService service;
    private final ExampleEventMapper mapper;
    @Value("${app.team-name}") private String teamName;

    @EventListener(ApplicationStartedEvent.class)
    public Disposable consume() {
        return kafkaReceiver.receive()
            .flatMap(record -> {
                var event = record.value();
                if (event == null || !isForMe(event.getReceiver().toString())) {
                    record.receiverOffset().acknowledge(); return Mono.empty();
                }
                return service.process(mapper.toDomain(event))
                    .doOnSuccess(r -> record.receiverOffset().acknowledge())
                    .doOnError(e -> log.error("Failed: {}", e.getMessage()));
            })
            .retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(5)))
            .subscribe();
    }

    private boolean isForMe(String receiver) {
        return "*".equals(receiver) || teamName.equals(receiver);
    }
}
```

## Producer

```java
@Service @RequiredArgsConstructor @Slf4j
public class ExampleProducer {
    private final KafkaSender<String, ExampleEvent> kafkaSender;
    private final ExampleEventMapper mapper;
    @Value("${spring.kafka.producer.topics.example}") private String topic;
    @Value("${app.team-name}") private String teamName;

    public Mono<Void> publish(ExampleDomain domain, String receiverTeam) {
        var event = mapper.toAvro(domain);
        event.setSender(teamName);
        event.setReceiver(receiverTeam);
        var record = SenderRecord.create(new ProducerRecord<>(topic, domain.key(), event), null);
        return kafkaSender.send(Mono.just(record))
            .doOnNext(r -> {
                if (r.exception() != null) throw new KafkaPublishException(r.exception());
            }).then();
    }
}
```

---

## Rules

### Consumer
- Avro only · always ack (success + skip) · no `.block()` · guard null
- `@EventListener(ApplicationStartedEvent.class)` to start
- Shared topic → filter on `receiver` + dedicated consumer group
- One consumer per topic

### Producer
- Avro only · no `.block()` · `acks=all` + idempotence enabled
- Always set `sender`/`receiver` on the Avro event
- Always check `SenderResult.exception()` — no fire-and-forget
- Stable business key for partition affinity · one bean per topic

---

## Avro Backward Compatibility

**Safe:** add field with default ✅ · new `.avsc` ✅

**Breaking (⛔ GATE):** field without default · remove field · rename · type change · namespace change

**Two-phase removal:** ① mark optional + default + deprecation doc → ② remove next sprint after consumers migrate

```
⛔ SCHEMA COMPATIBILITY GATE
Change: [description]  Risk: [impact]
Required: Add default OR two-phase removal. Tech Lead sign-off.
```

---

## Avro Plugin Setup

**Maven** (`pom.xml`) — add to `<plugins>`:
```xml
<plugin>
  <groupId>org.apache.avro</groupId>
  <artifactId>avro-maven-plugin</artifactId>
  <version>${avro.version}</version>
  <executions>
    <execution>
      <phase>generate-sources</phase>
      <goals><goal>schema</goal></goals>
      <configuration>
        <sourceDirectory>${project.basedir}/src/main/avro</sourceDirectory>
        <outputDirectory>${project.build.directory}/generated-sources/avro</outputDirectory>
        <stringType>String</stringType>
      </configuration>
    </execution>
  </executions>
</plugin>
```

**Gradle** (`build.gradle.kts`) — add plugin + task dependency:
```kotlin
plugins { id("com.github.davidmc24.gradle.plugin.avro") version "1.9.1" }
avro { stringType.set("String") }
tasks.named("compileKotlin") { dependsOn("generateAvroJava") }
```

**application.yml** — Schema Registry:
```yaml
spring:
  kafka:
    properties:
      schema.registry.url: ${SCHEMA_REGISTRY_URL}
      specific.avro.reader: true
```

