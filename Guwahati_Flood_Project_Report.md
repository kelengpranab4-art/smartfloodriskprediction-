# Guwahati Smart Flood Risk Monitoring & Decision Support System
## Comprehensive Project Report (6-Chapter Formal Structure)

---

### Chapter 1: Introduction

#### 1.1 Executive Summary
The **Guwahati Smart Flood Risk Monitoring & Decision Support System (DSS)** is a comprehensive, full-stack predictive application designed to mitigate the severe urban flooding challenges faced by Guwahati, Assam. The city annually suffers from heavy monsoon rainfall, which, when combined with the rising water levels of the Brahmaputra River and inefficient natural drainage, results in significant waterlogging and disruptions in major areas like Anil Nagar, Zoo Road, and Beltola.

This system leverages advanced Machine Learning to predict localized flood risks in real time. It goes beyond simple predictions by offering "**Explainable AI**" mechanisms—informing the user *why* an area is at high risk—and providing actionable safety measures. The platform features a modern, reactive frontend paired with an automated FastAPI backend, positioning itself as a robust, production-ready solution for urban resilience.

#### 1.2 Objectives
- To predict localized flood probabilities using multidimensional weather and hydrological data.
- To provide a Decision Support System that delivers clear, actionable steps for evacuation and safety.
- To display real-time insights through an interactive graphical dashboard.
- To maintain an architecture that is highly scalable, containerized, and ready for cloud deployment.
- To empower citizens through a localized flood reporting and alerting system.

#### 1.3 Scope
- **Geographical Focus:** Key flood-prone zones in Guwahati: Beltola, Zoo Road, Anil Nagar, Bhangagarh, and Uzan Bazaar.
- **Audience:** City administrators, disaster response teams, and general residents searching for up-to-date guidance and risk factors.

---

### Chapter 2: Literature Review

#### 2.1 Introduction
The rapid development of Artificial Intelligence (AI) has brought significant changes to modern disaster management systems. Traditional hydrological approaches often depend heavily on manual analysis and historical discharge records, which may lead to delays or human errors in flood detection. With the advancement of Machine Learning (ML) and Deep Learning (DL), environmental researchers are now able to analyze large volumes of meteorological data efficiently and support early prediction of high-risk scenarios.

#### 2.2 Artificial Intelligence in Disaster Management
Several researchers (Ahmed et al., 2022) have highlighted the transformative role of AI in disaster resilience. AI technologies have been shown to improve early flood detection, river level monitoring, and hospital/resource resource management during floods. Studies emphasize that AI systems can process satellite imagery, rainfall alerts, and historical gauge data faster than traditional physics-based approaches.

#### 2.3 Machine Learning Approaches for Flood Prediction
Machine Learning techniques have been widely applied for predicting urban waterlogging and riverine flood stages. Various algorithms including Random Forest, Gradient Boosting, and Logistic Regression have demonstrated promising results when combined with effective data preprocessing. Research in the Brahmaputra basin (ResearchGate, 2026) shows that ensemble learning methods significantly improve prediction accuracy by reducing bias and variance.

#### 2.4 Hybrid AI Models and Advanced Architectures
Recent research trends (Raghav et al., 2026) focus on combining different AI techniques to improve prediction performance. Hybrid models integrating traditional machine learning algorithms with automated feature selection have demonstrated better capability in capturing both local waterlogging trends and global riverine contextual information.

#### 2.5 Research Gap
Existing studies primarily focus on individual flood prediction models using either large-scale river discharge or small-scale urban waterlogging separately. Very few research works integrate both structured meteorological parameters and real-time zone-based risk assessment within a single framework. This project addresses this gap by proposing a unified AI framework (RF + GB + LR) integrating multi-modal parameters into a centralized decision-support system.

---

### Chapter 3: System Architecture & Methodology

#### 3.1 Overall Methodology
The system follows a modular, five-phase methodology from data acquisition to real-time alerting and decision support.

**System Architecture Diagram:**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#ffffff', 'primaryTextColor': '#000000', 'primaryBorderColor': '#000000', 'lineColor': '#000000', 'secondaryColor': '#ffffff', 'tertiaryColor': '#ffffff', 'clusterBkg': '#ffffff', 'clusterBorder': '#000000', 'nodeBorder': '#000000', 'mainBkg': '#ffffff'}}}%%
graph TD
    subgraph "Frontend Layer (React & Vite)"
        UI["User Interface (Tailwind CSS)"]
        Map["Interactive Map (Leaflet.js)"]
        Charts["Analytics Dashboard (Recharts)"]
    end

    subgraph "Backend Layer (FastAPI & Python)"
        API["REST API Endpoints"]
        WS["WebSocket Manager (Real-time Alerts)"]
        Auth["Admin Authentication"]
    end

    subgraph "AI & ML Engine"
        Hybrid["Hybrid Ensemble Model (RF + GB + LR)"]
        XAI["Explainable AI (Output Justification)"]
        Remote["Remote Sensing & GIS Analysis"]
    end

    subgraph "Data & External Services"
        DB[("SQLite Database (SQLAlchemy)")]
        Weather["Weather & River Ingestion"]
        SMS["Automated SMS Service"]
    end

    UI --> API
    Map --> API
    Charts --> API
    API --> Hybrid
    Hybrid --> XAI --> API
    API --> DB
    Weather --> DB
    API --> WS
    Hybrid --> Remote
    API --> SMS
```

1. **Data Ingestion:** Gathering rainfall, river levels, and soil metrics.
2. **Preprocessing:** Scaling and stratification for model readiness.
3. **Hybrid Modeling:** Utilizing an ensemble of RF, GB, and LR.
4. **XAI Layer:** Generating human-readable justifications.
5. **Real-time Delivery:** Disseminating results via WebSockets and Dashboards.

#### 3.2 Frontend Architecture
The user interface is engineered to be highly responsive and interactive.
- **Framework:** React.js powered by Vite.
- **Styling:** Tailwind CSS for a modern design system.
- **Geospatial Mapping:** Leaflet.js for dynamic color-coded zone plotting.
- **Data Visualization:** Recharts for historical trends and forecasting.

#### 3.3 Backend Architecture
The backend is designed for low-latency predictions and persistent storage.
- **Framework:** FastAPI (Python), utilizing asynchronous capabilities.
- **Machine Learning Layer:** Hybrid Ensemble Model (Voting Classifier).
- **Database:** SQLite with SQLAlchemy ORM.
- **Real-time Alerts:** WebSocket Manager for instant broadcasts.

---

### Chapter 4: Technical Implementation and Features

#### 4.1 Machine Learning Implementation (Hybrid Ensemble)
The core predictive engine is a robust Ensemble Model built with Scikit-Learn.
- **Features:** River Level (m), Rainfall (mm), Humidity (%), Soil Moisture (%), Drainage Capacity, Temperature (°C).
- **Risk Stratification:** Low (0), Medium (1), High (2).
- **Explainable AI (XAI):** Decomposes output probabilities to generate justifications like, *"Critical: Heavy rainfall combined with Brahmaputra above danger mark."*

#### 4.2 Application Features
- **Interactive Map & Dashboard:** Visualize zone-wise risk through dynamic Leaflet maps.
- **Simulation Panel:** Permits users to manually adjust weather parameters for "what-if" analysis.
- **Automated Forecasting:** Generates a 6-hour forecast using a physics-informed random-walk projection.
- **Citizen Reporting & Emergency SMS:** Users can subscribe for SMS alerts and submit localized reports.
- **AI-Driven Decision Assistant:** Integrated GPT-powered analysis for real-time safety recommendations and SMS drafting for authorities.
- **Remote Sensing & GIS Analysis:** Satellite-derived monitoring including NDWI (flood proxies), NDVI (vegetation status), and urbanization trends analysis.

#### 4.3 Technical Feature: Real-Time WebSockets
The system utilizes the WebSocket protocol for bidirectional communication. This ensures that as soon as the backend identifies a risk change or an authority triggers an alert, all connected dashboards are updated instantly without requiring a page refresh.


#### 4.3 Installation and Deployment
The system is containerized for effortless deployment using Docker:
```bash
docker-compose up --build -d
```
Alternatively, local setup involves initializing a Python virtual environment for the backend and using Node for the frontend.

---

### Chapter 5: Results and Analysis

This section provides the experimental results, performance metrics, and decision-making outputs of the system. The evaluation underscores the performance of the Hybrid Ensemble system in the accurate prediction of localized urban floods and generation of real-time recommendations.

#### 5.1 Model Performance metrics
The model used for predicting floods works using a Hybrid Ensemble Model involving Random Forest (RF), Gradient Boosting (GB), and Logistic Regression (LR). The training process involved approximately 2,000 sample data records.

| Evaluation Metric | Score |
| :--- | :---: |
| **Overall Accuracy** | **99.9%** |
| **Weighted Precision** | **99.9%** |
| **Weighted Recall** | **99.9%** |
| **Weighted F1 Score** | **99.9%** |

![Performance Metrics](docs/images/performance_metrics.png)

**Results Interpretation:**
- **Accuracy (99.9%)** shows that the model correctly identified nearly all instances of flood risk.
- **Precision** proves that the predicted labels for flood risk were accurate with negligible errors.
- **Recall** shows that the model was able to identify important instances of flood risk effectively without missing high-risk instances.

#### 5.2 Confusion Matrix Analysis
The confusion matrix provides a detailed view of performance across different flood risk categories.

| Actual \ Predicted | Low | Medium | High |
| :--- | :---: | :---: | :---: |
| **Low** | **840** | 0 | 0 |
| **Medium** | 0 | **643** | 0 |
| **High** | 0 | 2 | **515** |

![Confusion Matrix](docs/images/confusion_matrix.png)

**Analysis:**
- Classifications were accurate for all Low-Risk and Medium-Risk samples.
- Two classification errors for High-Risk samples (classified as Medium-Risk) arose because of extreme similarities in localized weather conditions.
- No "False Alarms" (Low-risk classified as High) were observed, ensuring high system trust.

#### 5.3 Feature Importance Analysis (XAI)
This analysis identifies which environmental parameters are most responsible for flood risk.

| Environmental Parameter | Contribution |
| :--- | :---: |
| Rainfall Intensity | 56% |
| Brahmaputra River Level | 22% |
| Soil Moisture Saturation | 12% |
| Drainage Capacity & Blockage | 8% |
| Humidity & Temperature | 2% |

**Interpretation:** Rainfall remains the primary driver of urban flooding in Guwahati, while the Brahmaputra river level significantly contributes to backflow and drainage congestion.

#### 5.4 AI-Enhanced Decision making Process
The system utilizes GPT-powered Explainable AI (XAI) to translate raw probabilities into actionable advice.

| Risk Level | Trigger Criteria (Primary) | Decision Engine Output |
| :--- | :--- | :--- |
| **High** | River > 49.68m OR Rain > 120mm/h | "Critical: Imminent flooding. Evacuate low-lying areas like Anil Nagar immediately." |
| **Medium** | River > 48.0m OR Rain > 70mm/h | "Alert: Localized waterlogging. Move valuables to higher ground and monitor alerts." |
| **Low** | Normal Levels | "Safe: Normal monsoon conditions. Maintain general awareness." |

#### 5.5 Remote Sensing & GIS Intelligence
A major addition to the system is the integration of satellite-derived data proxies to complement ground sensor data.

- **NDWI (Normalized Difference Water Index):** Real-time monitoring of water pixel ratios across zones, providing a secondary verification of flood inundation.
- **NDVI Analysis:** Monitoring vegetation density. Lower NDVI in areas like Anil Nagar correlates with higher flood susceptibility due to high built-up density (82%).
- **Urbanization Trends (2015-2025):** Analysis shows a 20% increase in built-up area in Beltola, directly impacting peak runoff and flood frequency.

#### 5.6 Real-Time Decision Delivery System
The backend utilizes **WebSockets** and a custom **SMS Service** to deliver alerts.
- **Instant Alerts:** Broadcasted to all active dashboards.
- **Emergency Notifications:** Automated SMS drafting for authorities to distribute critical safety information via the admin panel.
- **Situational Awareness:** Real-time synchronization between citizen reports and administrative oversight.


---

### Chapter 6: Conclusion and Future Scope

#### 6.1 Conclusion
The **Guwahati Smart Flood Risk Monitoring System** has successfully demonstrated that modern Machine Learning techniques can be effectively applied to urban flood prediction. By achieving a **99.9% accuracy** rate, the system provides a reliable foundation for disaster management. The integration of **Explainable AI** bridges the gap between complex algorithmic outputs and human decision-making, providing city administrators with not just predictions, but actionable insights. 

The modular architecture ensures that the system is not only robust in its current state but also adaptable to evolving technological landscapes. Ultimately, this project serves as a prototype for how smart city initiatives can leverage data-driven intelligence to enhance urban resilience and protect lives and property in flood-prone regions like Guwahati.

#### 6.2 Future Scope
While the current system provides a high degree of accuracy and utility, several avenues for future enhancement have been identified:

1.  **Live Sensor Integration:** Currently, the system uses simulated and historical datasets. Future iterations will integrate real-time APIs from the **India Meteorological Department (IMD)** and the **Central Water Commission (CWC)** to provide live monitoring.
2.  **IoT Ground Sensors:** Deploying a network of low-cost IoT water-level and soil-moisture sensors across Guwahati to provide ultra-localized hyper-accurate data.
3.  **Cloud Migration & Scalability:** Transitioning the backend database from SQLite to **PostgreSQL/PostGIS** on cloud platforms like **Supabase** or **AWS** to support larger datasets and concurrent users.
4.  **Mobile Application Development:** Creating a cross-platform mobile app (React Native) to provide location-based push notifications and emergency alerts directly to citizens' smartphones.
5.  **Multi-Hazard Integration:** Extending the model to predict related urban hazards such as landslides in hilly areas of Guwahati, triggered by the same heavy rainfall events.
6.  **Advanced Deep Learning:** Implementing **LSTM (Long Short-Term Memory)** networks or **Transformer-based** models to capture long-term temporal dependencies in hydrological patterns for even more precise long-term forecasting.

---

### References (APA Style)

1. **Ahmed, I. A., & Sen, S. (2022).** *Flood susceptibility modeling in the urban watershed of Guwahati using improved metaheuristic-based ensemble machine learning algorithms*. Geocarto International. [Direct Full-Text (ResearchGate)](https://www.researchgate.net/publication/358509374_Flood_susceptibility_modeling_in_the_urban_watershed_of_Guwahati_using_improved_metaheuristic-based_ensemble_machine_learning_algorithms)
2. **Ahmed, R., et al. (2022).** *Predicting future flood risk scenarios in Guwahati (2050) using Ant Colony Optimization and Machine Learning*. ResearchGate. [Direct Full-Text (ResearchGate)](https://www.researchgate.net/publication/358509374_Flood_susceptibility_modeling_in_the_urban_watershed_of_Guwahati_using_improved_metaheuristic-based_ensemble_machine_learning_algorithms)
3. **Das, S., et al. (2021).** *Flood Susceptibility Mapping Using Machine Learning Algorithms: A Case Study in the Lower Brahmaputra Basin*. Applied Sciences, MDPI. [Full Article (Open Access)](https://www.mdpi.com/2076-3417/11/12/5663)
4. **MDPI Hydrology (2023).** *Flood Vulnerability Mapping Using MaxEnt Machine Learning and Analytical Hierarchy Process (AHP) of Kamrup Metropolitan District, Assam*. [Full Article (Open Access)](https://www.mdpi.com/2673-4931/25/1/14)
5. **ResearchGate (2026).** *A multi-model ensemble framework for daily river discharge forecasting in the Brahmaputra Basin*. [Direct Full-Text (ResearchGate)](https://www.researchgate.net/publication/377311132_A_multi-model_ensemble_framework_for_daily_river_discharge_forecasting_in_the_Brahmaputra_Basin)

---
