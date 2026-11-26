# telikos-activityplanworkflow-service — lessons

## build | default `java` (Corretto 21.0.11) breaks Lombok 1.18.30 annotation processing
status: captured (2026-09-30, task-180 ATA/ATD derivation)

`mvn -pl <module> -am test` fails on `persistence` (or the first module using
Lombok-generated code) with `Fatal error compiling:
java.lang.ExceptionInInitializerError: com.sun.tools.javac.code.TypeTag ::
UNKNOWN` when the active JDK is Corretto 21.0.11 (`/usr/libexec/java_home`
default on this machine). The pom pins `<source>21</source>`, so JDK 17
(Temurin) also fails (`release version 21 not supported`) — this is not a
"downgrade to 17" fix. Building with Corretto 21.0.4 instead
(`~/Library/Java/JavaVirtualMachines/corretto-21.0.4/Contents/Home`)
compiles and runs tests cleanly against the same Lombok 1.18.30. Set
`JAVA_HOME` to the 21.0.4 install before any `mvn` invocation in this repo
until Lombok is upgraded past whatever internal javac API 21.0.11 changed.
