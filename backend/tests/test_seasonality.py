import unittest
from datetime import date
from unittest.mock import patch
from app.services.seasonality_service import SeasonalityService

class TestSeasonalityService(unittest.TestCase):
    def setUp(self):
        self.service = SeasonalityService()

    @patch('app.services.seasonality_service.datetime')
    def test_diwali_season(self, mock_datetime):
        mock_datetime.date.today.return_value = date(2025, 10, 15)
        mock_datetime.date.return_value = date(2025, 10, 15)
        
        tips = self.service.get_seasonal_tips()
        self.assertEqual(tips['tips'][0]['title'], "Diwali Sale Season")

    @patch('app.services.seasonality_service.datetime')
    def test_no_season(self, mock_datetime):
        mock_datetime.date.today.return_value = date(2025, 3, 10)
        mock_datetime.date.return_value = date(2025, 3, 10)
        
        tips = self.service.get_seasonal_tips()
        self.assertEqual(tips['tips'][0]['title'], "Smart Shopping")

if __name__ == '__main__':
    unittest.main()
