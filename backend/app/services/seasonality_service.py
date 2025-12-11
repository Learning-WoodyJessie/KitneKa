import datetime

class SeasonalityService:
    def get_seasonal_tips(self):
        """
        Returns a list of buying tips based on the current date and Indian shopping seasons.
        """
        today = datetime.date.today()
        month = today.month
        day = today.day
        
        tips = []
        
        # General Seasonality Logic
        if month == 10 or (month == 11 and day < 15):
            tips.append({
                "title": "Diwali Sale Season",
                "description": "Major discounts on Electronics and Home Appliaces. Best time to buy TVs, Laptops, and Phones.",
                "confidence": "High"
            })
        elif month == 12 and day > 20:
            tips.append({
                "title": "Year End Clearance",
                "description": "Look out for stock clearance sales on fashion and older electronics models.",
                "confidence": "Medium"
            })
        elif month == 1 and day < 26:
            tips.append({
                "title": "Republic Day Sales",
                "description": "Upcoming sales around Jan 26th. Hold off on major purchases if possible.",
                "confidence": "High"
            })
        elif month == 8 and day < 15:
            tips.append({
                "title": "Independence Day Sales",
                "description": "Expect good deals on mobile phones and accessories.",
                "confidence": "Medium"
            })
        elif month == 5:
            tips.append({
                "title": "Summer Sales",
                "description": "Good time for ACs and Refrigerators deals.",
                "confidence": "Medium"
            })
            
        # Default Tip if no major event
        if not tips:
            tips.append({
                "title": "Smart Shopping",
                "description": "No major sale events right now. Use price history to check if the current price is a deal.",
                "confidence": "Low"
            })
            
        return {
            "date": today.isoformat(),
            "tips": tips
        }
