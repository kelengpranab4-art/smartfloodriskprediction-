# pyright: reportMissingModuleSource=false
from sqlalchemy import Column, Integer, String, Float, DateTime # type: ignore
from database import Base
from datetime import datetime, timezone

class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True)
    zone_name = Column(String, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Features
    rainfall = Column(Float)
    river_level = Column(Float)
    humidity = Column(Float)
    soil_moisture = Column(Float)
    drainage_cap = Column(Float)
    temp = Column(Float)
    
    # Model Output
    risk_score = Column(Float)
    risk_label = Column(String)

class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(Integer, primary_key=True, index=True)
    zone_name = Column(String, index=True)
    severity = Column(String)
    description = Column(String)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

class Subscriber(Base):
    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, index=True, unique=True)
    zone_name = Column(String, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
