# Projekt łączony dla Technologii Chmurowych i Bezpieczeństwa Aplikacji Webowych

## Autor: Michał Ryduchowski

# Informacje

## Uruchomienie projektu na Kubernetes z Ingress (Minikube)

### 1. Zbuduj obrazy Dockera lokalnie

W katalogu głównym repozytorium:
```bash
docker build -t m1dnightsp/frontend:latest ./frontend
docker build -t m1dnightsp/backend:latest  ./backend
docker build -t m1dnightsp/database:latest ./database
```

### 2. Ustaw środowisko Dockera na Minikube

```bash
minikube docker-env
```
Następnie wykonaj polecenie wyświetlone przez Minikube (np. na Windows: `& minikube -p minikube docker-env | Invoke-Expression`).

### 3. Uruchom Minikube i włącz Ingress

```bash
minikube start
minikube addons enable ingress
```

### 4. Zastosuj manifesty Kubernetes

```bash
kubectl apply -f k8s/database-configmap.yml
kubectl apply -f k8s/database-deployment.yaml
kubectl apply -f k8s/database-service.yaml
# poczekaj na Ready
kubectl rollout status deployment/postgres
# dopiero potem wszystkie kolejne:
kubectl apply -f k8s/backend-configmap.yaml
kubectl apply -f k8s/backend-secret.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/keycloak-realm-config.yaml
kubectl apply -f k8s/keycloak-deployment.yaml
kubectl apply -f k8s/keycloak-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/ingress.yaml
```

### 5. Uruchom tunel Minikube (w nowym terminalu)

```bash
minikube tunnel
```
Pozostaw to okno otwarte przez cały czas działania aplikacji.

### 6. Otwórz aplikację w przeglądarce

Przejdź do:
```
http://127.0.0.1/
```
Frontend powinien się wyświetlić, a żądania do `/users` będą przekierowane przez Ingress do backendu.

Powinien się otworzyć panel logowania keycloak, wtedy można się zalogować podstawowymi user: admin i password: admin. Jeśli chcesz dodać użytkowników to można to zrobić przez keycloak dashboard `kubectl port-forward svc/keycloak 8080:8080`.

---

**Podsumowanie:**  
Po wykonaniu powyższych kroków aplikacja powinna być dostępna pod `http://127.0.0.1/` z pełnym routingiem przez Ingress.

## Monitoring (Prometheus + Grafana)

### 1. Zainstaluj Helm (jeśli jeszcze nie masz)

Pobierz i rozpakuj plik `helm-vX.Y.Z-windows-amd64.zip` z [https://github.com/helm/helm/releases/latest](https://github.com/helm/helm/releases/latest),  
skopiuj `helm.exe` do folderu w PATH i sprawdź `helm version`.

### 2. Dodaj repozytorium Helm Prometheus Community

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

### 3. Zainstaluj Prometheus + Grafana

```bash
helm install prometheus prometheus-community/kube-prometheus-stack
```

### 4. Otwórz Grafanę

Znajdź nazwę serwisu Grafany:
```bash
kubectl get svc
```
Powinieneś zobaczyć coś jak `prometheus-grafana`.

Uruchom port-forward:
```bash
kubectl port-forward svc/prometheus-grafana 3000:80
```
Teraz Grafana będzie dostępna na [http://localhost:3000](http://localhost:3000).

### 5. Zaloguj się do Grafany

Login: `admin`  
Hasło uzyskasz poleceniem (w PowerShell):

```powershell
kubectl get secret prometheus-grafana -o jsonpath="{.data.admin-password}" | %{ [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($_)) }
```

### 6. Otwórz dashboard

Po zalogowaniu kliknij **+ → Import** i wklej np. ID `315` (Kubernetes / Compute Resources / Pod) lub `1860` (Kubernetes cluster monitoring).

![monitoring dla frontendu](preview/frontend_monitoring.png)
---

Po tych krokach masz pełny monitoring klastra i aplikacji.

# Wymagania

## Projekt: Technologie Chmurowe

### Ogólne informacje
Projekt składa się z dwóch niezależnych etapów. Każdy etap podlega osobnej ocenie (maks. 50 punktów bazowych + maks. 10 punktów dodatkowych) i stanowi 50% oceny końcowej. Warunkiem zaliczenia projektu jest uzyskanie co najmniej 25 punktów bazowych z każdego etapu.

### Wymagania dotyczące zakresu projektu

#### Aplikacja Mikroserwisowa
Należy zaimplementować aplikację opartą na architekturze mikroserwisowej, składającą się z co najmniej trzech odrębnych, logicznie uzasadnionych usług (mikroserwisów). Przykładowe komponenty:
- Usługa frontendowa
- Usługa backendowa (API)
- Usługa dedykowana (np. obsługa logiki biznesowej)
- Baza danych (SQL/NoSQL)
- Pamięć podręczna (np. Redis)
- System kolejkowy (np. RabbitMQ)

Technologie implementacji są dowolne. Należy zadbać o poprawną komunikację między serwisami (np. REST, gRPC, komunikacja przez kolejkę).

---

### Etap I: Wdrożenie z użyciem Docker Compose (50% oceny końcowej)

**Cel etapu:** Skonfigurowanie i uruchomienie całej aplikacji mikroserwisowej lokalnie przy użyciu Docker Compose, z naciskiem na dobre praktyki konteneryzacji.

- **Maksymalna liczba punktów bazowych:** 50 pkt.
- **Minimalny próg zaliczenia Etapu I:** 25 pkt.

#### Wymagane elementy i punktacja:
- **Jakość Architektury:** (8 pkt)  
    Ocenie podlega logiczny podział na mikroserwisy, spójność i poprawność zaimplementowanej komunikacji między nimi.
- **Definicja Usług (docker-compose.yml):** (14 pkt)  
    Wymagana jest poprawna składnia pliku `docker-compose.yml`.  
    Należy zdefiniować wszystkie usługi aplikacji oraz zależności (`depends_on`).  
    Wymagane jest efektywne zarządzanie konfiguracją (np. zmienne środowiskowe).
- **Sieci Docker:** (6 pkt)  
    Należy utworzyć i wykorzystać niestandardową sieć Docker.  
    Wymagana jest poprawna konfiguracja komunikacji przez nazwy kontenerów.
- **Wolumeny Docker:** (6 pkt)  
    Należy skonfigurować wolumeny dla usług stanowych w celu zapewnienia trwałości danych.
- **Optymalizacja Obrazów Docker (Dockerfile):** (11 pkt)  
    Należy przygotować własne, poprawne pliki `Dockerfile`.  
    Wymagane jest zastosowanie technik minimalizacji rozmiaru obrazu (multi-stage builds, itp.).  
    Ocenie podlega efektywne wykorzystanie cache'u warstw oraz użycie `.dockerignore`.
- **Multiplatformowość:** (5 pkt)  
    Należy zbudować obrazy wieloarchitekturowe (`amd64`, `arm64`) przy użyciu `docker buildx` lub podobnego mechanizmu.

#### Zagadnienia Dodatkowe (Etap I - Maksymalnie 10 punktów ekstra):
- Implementacja dyrektyw `healthcheck` w pliku `docker-compose.yml`. (+4 pkt)
- Wykorzystanie argumentów budowania (`ARG`) i zmiennych (`ENV`) w `Dockerfile` do parametryzacji. (+1 pkt)
- Zastosowanie Docker Secrets do zarządzania danymi wrażliwymi. (+3 pkt)
- Implementacja mechanizmu "live reload"/"hot reload" dla usług deweloperskich. (+2 pkt)

---

### Etap II: Migracja do Kubernetes (50% oceny końcowej)

**Cel etapu:** Przeniesienie tej samej aplikacji mikroserwisowej do środowiska Kubernetes, konfiguracja zasobów oraz zapewnienie skalowalności i dostępności.

- **Maksymalna liczba punktów bazowych:** 50 pkt.
- **Minimalny próg zaliczenia Etapu II:** 25 pkt.

#### Wymagane elementy i punktacja:
- **Manifesty Zasobów Kubernetes (Deployment, Service, ConfigMap, Secret):** (19 pkt)  
    Należy przygotować poprawne manifesty YAML.  
    Wymagana jest poprawna konfiguracja selektorów, etykiet, portów.  
    Ocenie podlega bezpieczne zarządzanie sekretami i konfiguracją.
- **Trwałe Przechowywanie Danych (PV/PVC):** (9 pkt)  
    Wymagana jest poprawna definicja `PersistentVolumeClaim`.  
    Należy użyć `StorageClass` (jeśli dostępne) lub zdefiniować `PersistentVolume`.  
    Ocenie podlega poprawne podmontowanie wolumenów w Podach.
- **Ruch Zewnętrzny (Ingress / LoadBalancer):** (9 pkt)  
    Należy skonfigurować dostęp do aplikacji z zewnątrz za pomocą `Ingress` lub `Service` typu `LoadBalancer`.  
    Wymagana jest poprawna konfiguracja reguł routingu lub ekspozycji portów.
- **Skalowanie Aplikacji (Replicas + HPA):** (13 pkt)  
    Należy ustawić odpowiednią liczbę replik (`replicas`) w `Deployment`.  
    Wymagane jest skonfigurowanie działającego `HorizontalPodAutoscaler` (HPA) dla co najmniej jednej usługi (wymaga Metrics Server).

#### Zagadnienia Dodatkowe (Etap II - Maksymalnie 10 punktów ekstra):
- **Monitoring:** Wdrożenie Prometheus + Grafana, konfiguracja `ServiceMonitor`/adnotacji, stworzenie prostego dashboardu. (+4 pkt)
- **Helm:** Spakowanie aplikacji jako Helm Chart. (+3 pkt)
- **CI/CD:** Zaimplementowanie prostego potoku CI/CD (np. GitHub Actions) do automatycznego budowania obrazów i pushowania do repozytorium kontenerów. (+3 pkt)

---

### Kryteria Oceny Ogólnej
- **Funkcjonalność:** Ocenie podlega poprawne działanie aplikacji w obu środowiskach.
- **Kompletność:** Ocenie podlega zrealizowanie wszystkich wymaganych elementów bazowych.
- **Jakość Kodu i Konfiguracji:** Ocenie podlega poprawność i zgodność z dobrymi praktykami plików `Dockerfile`, `docker-compose.yml`, manifestów Kubernetes.
- **Zaliczenie Etapów:** Warunkiem zaliczenia jest uzyskanie minimum 25 punktów bazowych z Etapu I **ORAZ** minimum 25 punktów bazowych z Etapu II.
- **Ocena Końcowa:** Ocena końcowa jest średnią arytmetyczną procentowego wyniku punktowego (punkty bazowe + dodatkowe, maks. 60 pkt na etap) z obu etapów.

---

### Format oddania projektu
Link do repozytorium Git. Należy zapewnić możliwość uruchomienia i oceny projektu przez prowadzącego.

---

### Termin oddania projektu
Projekt należy oddać najpóźniej do dnia **11.06.2025** w celu uzyskania pełnej punktacji.  
Każdy kolejny dzień zwłoki obniża punktację o **5% wartości końcowej**.  
Po dniu **20.06.2025** projekty nie będą przyjmowane ani oceniane.

## Projekt: Bezpieczeństwo Aplikacji Webowych
### Aktualne 2025 Wymagania do projektu

Celem projektu jest zabezpieczenie FE oraz przynajmniej jednego API używając standardu OAuth 2.0. Mogą to być niezależne aplikacje.

Termin oddania projektu to najpóźniej **20.06.2025**. Zachęcam do wcześniejszego oddawania.  
Bliżej terminu podam godziny moich konsultacji (na wydziale i online). Jeżeli ktoś będzie miał projekt gotowy wcześniej, możemy umówić się na prezentację we wcześniejszym terminie.

Projekt można połączyć z projektem z Technologii Chmurowych (za dodatkowe punkty) lub jako oddzielny projekt. W przypadku tworzenia oddzielnego projektu proszę stworzyć go tutaj i podpisać swoim imieniem i nazwiskiem w pliku `README.md`.

Ocena projektu odbędzie się w trakcie prezentacji (maks. 10 minut). Dla projektów łączonych (moje grupy 3 i 4) można zrobić jedną prezentację.  
Proszę umieścić w projekcie krótkie `README` z instrukcją, jak odpalić wszystkie komponenty.

Projekt będzie oceniany według następujących kryteriów:

| **Zagadnienie** | **Punktacja** |
|------------------|--------------|
| Projekt (FE, API, IdP) działa | 5 |
| Dokeryzacja: projekt działa w Kubernetes | 4 |
| Dokeryzacja: bez Kubernetes, ale app i IdP są w Dockerze (z wolumenem) | 2 |
| Dokeryzacja: app odpalana lokalnie, Keycloak ma wolumen z danymi | 1 |
| Projekt jest dodany do projektu Technologii Chmurowych | 3 |
| FE jest zabezpieczony | 4 |
| FE ma oddzielny panel admina niedostępny dla zwykłych użytkowników | 2 |
| Przynajmniej jedno API jest zabezpieczone niezależnie od FE lub FE sam się autoryzuje do naszego BE | 4 |
| Więcej niż jedno API jest zabezpieczone | 1 |
| API zwraca różne wartości w zależności od roli użytkownika | 2 |
| Zabezpieczenie zostało poprawnie zaprezentowane (mogę poprosić o wytłumaczenie flow) | 2 |
| Czystość kodu i repozytorium | 2 |
| PKCE | 1 |

**Suma:** 30 punktów

#### Dodatkowe punkty:
- Aplikacje napisane w innym języku niż JS/TS (np. Java, Rust) (+4 pkt)
- Dodanie zabezpieczenia do projektu z zeszłego semestru (lub innego swojego większego projektu) (+4 pkt)
- FE korzysta ze stworzonego API (+4 pkt)
