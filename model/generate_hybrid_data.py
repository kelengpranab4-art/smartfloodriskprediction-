import pandas as pd
import numpy as np
import os

def generate_data(num_samples=10000):
    """
    Generate a rich hybrid dataset for Guwahati flood prediction.
    
    Features:
      - river_level     : Brahmaputra water level (m). Danger mark = 49.68m.
      - rainfall        : Cumulative 24h rainfall (mm). Monsoon ~150-200mm/day peak.
      - humidity        : Relative humidity (%). High humidity = slower drainage.
      - soil_moisture   : Soil saturation index (0-1). Near 1 = fully saturated = fast runoff.
      - drainage_cap    : Drainage capacity utilisation (0-1). 1 = completely blocked.
      - temp            : Temperature (°C). Affects evaporation rate.
    
    Label: risk_score  →  0=Low, 1=Medium, 2=High
    """
    np.random.seed(42)

    # --- Base feature generation ---
    # River level: base around 46-47m, but during monsoon it can spike to 53-55m
    # Use a mix: 70% normal distribution + 30% extreme flood period samples
    season_phase = np.random.uniform(0, 2 * np.pi, num_samples)  # simulate seasonal cycle

    # Normal period: river level 42-52m
    seasonal_river = 2.5 * np.sin(season_phase) + 0.5 * np.random.randn(num_samples)
    river_level_normal = np.clip(47.0 + seasonal_river + np.random.uniform(-2.0, 2.0, num_samples), 42.0, 55.5)

    # Extreme monsoon period: river level 49-55.5m (Brahmaputra flood events)
    river_level_extreme = np.clip(np.random.uniform(49.5, 55.5, num_samples), 42.0, 55.5)

    # Mix 70/30
    mask = np.random.rand(num_samples) < 0.70
    river_level = np.where(mask, river_level_normal, river_level_extreme)

    # Rainfall correlated with season; heavier during extreme flood periods
    seasonal_rain = 80 * np.clip(np.sin(season_phase), 0, 1)
    base_rain = seasonal_rain + np.random.exponential(35, num_samples)
    # During extreme flood periods, more rainfall
    extreme_rain = np.random.uniform(100, 250, num_samples)
    rainfall = np.clip(np.where(mask, base_rain, extreme_rain), 0, 250)

    # Humidity correlated with rainfall
    humidity = np.clip(60 + (rainfall / 250) * 35 + np.random.normal(0, 5, num_samples), 40, 100)

    # Soil moisture: rises with rainfall and stays elevated for days
    soil_moisture = np.clip(
        0.2 + (rainfall / 250) * 0.6 + (river_level - 42) / 13.5 * 0.2 + np.random.normal(0, 0.05, num_samples),
        0.0, 1.0
    )

    # Drainage capacity: worsens (approaches 1) during heavy rain + poor infra zones
    drainage_cap = np.clip(
        0.1 + (rainfall / 250) * 0.5 + soil_moisture * 0.3 + np.random.normal(0, 0.07, num_samples),
        0.0, 1.0
    )

    # Temperature: inverse relationship with rain (cooling effect of rain)
    temp = np.clip(35 - (rainfall / 250) * 10 + np.random.normal(0, 2, num_samples), 18, 40)

    data = pd.DataFrame({
        'river_level': river_level,
        'rainfall': rainfall,
        'humidity': humidity,
        'soil_moisture': soil_moisture,
        'drainage_cap': drainage_cap,
        'temp': temp,
    })

    def classify_risk(row):
        rl = row['river_level']
        rf = row['rainfall']
        sm = row['soil_moisture']
        dc = row['drainage_cap']
        hum = row['humidity']

        # --- HIGH RISK Conditions ---
        # Critical: river above danger + heavy rain
        if rl > 53.0:
            return 2
        if rl > 49.68 and rf > 150:
            return 2
        if rf > 180:
            return 2
        # Saturated soil + blocked drainage + elevated river = high flood risk
        if sm > 0.85 and dc > 0.80 and rl > 49.0:
            return 2
        # Very heavy rain + saturated soil even if river not at danger mark yet
        if rf > 130 and sm > 0.80 and dc > 0.75:
            return 2
        # High humidity + heavy rain sustained = urban waterlogging escalation
        if hum > 92 and rf > 120 and rl > 49.68:
            return 2

        # --- MEDIUM RISK Conditions ---
        if rl > 49.68:
            return 1
        if rf > 80:
            return 1
        if sm > 0.65 and dc > 0.55:
            return 1
        if hum > 88 and rf > 60:
            return 1
        if rf > 60 and rl > 48.0:
            return 1

        # --- LOW RISK ---
        return 0

    data['risk_score'] = data.apply(classify_risk, axis=1)
    label_map = {0: 'Low', 1: 'Medium', 2: 'High'}
    data['risk_label'] = data['risk_score'].map(label_map)

    # Round for cleaner data
    data = data.round(4)

    return data


if __name__ == "__main__":
    df = generate_data(10000)
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    csv_path = os.path.join(data_dir, 'flood_dataset.csv')
    df.to_csv(csv_path, index=False)
    print(f"✅ Generated enhanced dataset with {len(df)} samples → {csv_path}")
    print(f"\nClass distribution:")
    print(df['risk_label'].value_counts())
    print(f"\nFeature statistics:")
    print(df.drop(columns=['risk_label']).describe().round(2))
