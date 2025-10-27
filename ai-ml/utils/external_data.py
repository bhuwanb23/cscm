"""
External Data Ingestion for CSCM AI/ML System

This module provides functions for ingesting external signals such as weather, events, and macro indices.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExternalDataIngestor:
    """Class for ingesting external data signals."""
    
    def __init__(self, data_path="../data/raw"):
        """
        Initialize the external data ingestor.
        
        Args:
            data_path (str): Path to the raw data directory
        """
        self.data_path = data_path
        logger.info("ExternalDataIngestor initialized")
    
    def load_weather_data(self):
        """
        Load weather data from file.
        
        Returns:
            pd.DataFrame: Weather data or empty DataFrame if not found
        """
        try:
            weather_file = os.path.join(self.data_path, "weather.csv")
            if os.path.exists(weather_file):
                weather_data = pd.read_csv(weather_file)
                logger.info(f"Loaded weather data with {len(weather_data)} records")
                return weather_data
            else:
                logger.warning(f"Weather data file not found: {weather_file}")
                return pd.DataFrame()
        except Exception as e:
            logger.error(f"Error loading weather data: {e}")
            return pd.DataFrame()
    
    def load_event_data(self):
        """
        Load event data from file.
        
        Returns:
            pd.DataFrame: Event data or empty DataFrame if not found
        """
        try:
            event_file = os.path.join(self.data_path, "events.csv")
            if os.path.exists(event_file):
                event_data = pd.read_csv(event_file)
                logger.info(f"Loaded event data with {len(event_data)} records")
                return event_data
            else:
                logger.warning(f"Event data file not found: {event_file}")
                return pd.DataFrame()
        except Exception as e:
            logger.error(f"Error loading event data: {e}")
            return pd.DataFrame()
    
    def load_macro_data(self):
        """
        Load macroeconomic data from file.
        
        Returns:
            pd.DataFrame: Macroeconomic data or empty DataFrame if not found
        """
        try:
            macro_file = os.path.join(self.data_path, "macro_indices.csv")
            if os.path.exists(macro_file):
                macro_data = pd.read_csv(macro_file)
                logger.info(f"Loaded macroeconomic data with {len(macro_data)} records")
                return macro_data
            else:
                logger.warning(f"Macroeconomic data file not found: {macro_file}")
                return pd.DataFrame()
        except Exception as e:
            logger.error(f"Error loading macroeconomic data: {e}")
            return pd.DataFrame()
    
    def process_weather_data(self, weather_data):
        """
        Process weather data for integration with sales data.
        
        Args:
            weather_data (pd.DataFrame): Raw weather data
            
        Returns:
            pd.DataFrame: Processed weather data
        """
        try:
            if weather_data is None or weather_data.empty:
                logger.warning("No weather data to process")
                return pd.DataFrame()
            
            # Convert date column
            weather_data['date'] = pd.to_datetime(weather_data['date'])
            
            # Ensure numeric columns are properly typed
            numeric_columns = ['temperature', 'humidity', 'precipitation', 'wind_speed']
            for col in numeric_columns:
                if col in weather_data.columns:
                    weather_data[col] = pd.to_numeric(weather_data[col], errors='coerce')
            
            # Add weather condition categories
            if 'condition' in weather_data.columns:
                weather_data['is_sunny'] = weather_data['condition'].str.contains('sun', case=False, na=False)
                weather_data['is_rainy'] = weather_data['condition'].str.contains('rain', case=False, na=False)
                weather_data['is_snowy'] = weather_data['condition'].str.contains('snow', case=False, na=False)
            
            logger.info(f"Processed weather data with {len(weather_data)} records")
            return weather_data
        except Exception as e:
            logger.error(f"Error processing weather data: {e}")
            return pd.DataFrame()
    
    def process_event_data(self, event_data):
        """
        Process event data for integration with sales data.
        
        Args:
            event_data (pd.DataFrame): Raw event data
            
        Returns:
            pd.DataFrame: Processed event data
        """
        try:
            if event_data is None or event_data.empty:
                logger.warning("No event data to process")
                return pd.DataFrame()
            
            # Convert date columns
            event_data['start_date'] = pd.to_datetime(event_data['start_date'])
            event_data['end_date'] = pd.to_datetime(event_data['end_date'])
            
            # Ensure numeric columns are properly typed
            numeric_columns = ['expected_attendance', 'impact_score']
            for col in numeric_columns:
                if col in event_data.columns:
                    event_data[col] = pd.to_numeric(event_data[col], errors='coerce')
            
            # Ensure string columns are properly typed
            string_columns = ['event_name', 'event_type', 'location']
            for col in string_columns:
                if col in event_data.columns:
                    event_data[col] = event_data[col].astype(str)
            
            logger.info(f"Processed event data with {len(event_data)} records")
            return event_data
        except Exception as e:
            logger.error(f"Error processing event data: {e}")
            return pd.DataFrame()
    
    def process_macro_data(self, macro_data):
        """
        Process macroeconomic data for integration with sales data.
        
        Args:
            macro_data (pd.DataFrame): Raw macroeconomic data
            
        Returns:
            pd.DataFrame: Processed macroeconomic data
        """
        try:
            if macro_data is None or macro_data.empty:
                logger.warning("No macroeconomic data to process")
                return pd.DataFrame()
            
            # Convert date column
            macro_data['date'] = pd.to_datetime(macro_data['date'])
            
            # Ensure numeric columns are properly typed
            numeric_columns = ['gdp_growth', 'unemployment_rate', 'inflation_rate', 'consumer_confidence']
            for col in numeric_columns:
                if col in macro_data.columns:
                    macro_data[col] = pd.to_numeric(macro_data[col], errors='coerce')
            
            logger.info(f"Processed macroeconomic data with {len(macro_data)} records")
            return macro_data
        except Exception as e:
            logger.error(f"Error processing macroeconomic data: {e}")
            return pd.DataFrame()
    
    def integrate_external_signals(self, base_data, date_column='date'):
        """
        Integrate all external signals with base data.
        
        Args:
            base_data (pd.DataFrame): Base data to integrate with
            date_column (str): Name of the date column in base_data
            
        Returns:
            pd.DataFrame: Base data with integrated external signals
        """
        try:
            if base_data is None or base_data.empty:
                logger.warning("No base data to integrate with external signals")
                return pd.DataFrame()
            
            # Load external data
            weather_data = self.load_weather_data()
            event_data = self.load_event_data()
            macro_data = self.load_macro_data()
            
            # Process external data
            weather_data = self.process_weather_data(weather_data)
            event_data = self.process_event_data(event_data)
            macro_data = self.process_macro_data(macro_data)
            
            # Start with base data
            integrated_data = base_data.copy()
            
            # Integrate weather data
            if not weather_data.empty:
                integrated_data = pd.merge(integrated_data, weather_data, on=date_column, how='left')
            
            # Integrate macro data
            if not macro_data.empty:
                integrated_data = pd.merge(integrated_data, macro_data, on=date_column, how='left')
            
            # Integrate event data (more complex - need to check if date falls within event period)
            if not event_data.empty and not integrated_data.empty:
                # Add event flags
                integrated_data['has_event'] = False
                integrated_data['event_name'] = ''
                integrated_data['event_type'] = ''
                integrated_data['event_impact'] = 0
                
                for _, event in event_data.iterrows():
                    mask = (integrated_data[date_column] >= event['start_date']) & \
                           (integrated_data[date_column] <= event['end_date'])
                    integrated_data.loc[mask, 'has_event'] = True
                    integrated_data.loc[mask, 'event_name'] = event['event_name']
                    integrated_data.loc[mask, 'event_type'] = event['event_type']
                    integrated_data.loc[mask, 'event_impact'] = event.get('impact_score', 0)
            
            logger.info(f"Integrated external signals with {len(integrated_data)} records")
            return integrated_data
        except Exception as e:
            logger.error(f"Error integrating external signals: {e}")
            return base_data

# Example usage
if __name__ == "__main__":
    # Create sample data
    sample_data = pd.DataFrame({
        'date': pd.date_range('2023-01-01', periods=10),
        'sales': np.random.randint(10, 100, 10)
    })
    
    # Create ingestor
    ingestor = ExternalDataIngestor()
    
    # Integrate external signals
    integrated_data = ingestor.integrate_external_signals(sample_data)
    print("Data with integrated external signals:")
    print(integrated_data.head())