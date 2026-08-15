import random


class SensorSimulator:
    def __init__(self, seed=None):
        if seed is not None:
            random.seed(seed)

        self.temperature = random.uniform(25.0, 30.0)
        self.humidity = random.uniform(50.0, 70.0)
        self.pressure = random.uniform(1000.0, 1015.0)

        self.aqi = random.uniform(20.0, 60.0)
        self.tvoc = random.uniform(50.0, 200.0)
        self.eco2 = random.uniform(400.0, 800.0)

        self.light = random.uniform(200.0, 600.0)
        self.sound = random.uniform(40.0, 60.0)
        self.uv = random.uniform(1.0, 4.0)

        self.rain = False

    def update(self):
        """
        Simulate small natural changes in sensor readings.
        """

        self.temperature += random.uniform(-0.3, 0.3)
        self.humidity += random.uniform(-0.8, 0.8)
        self.pressure += random.uniform(-0.5, 0.5)

        self.aqi += random.uniform(-3.0, 3.0)
        self.tvoc += random.uniform(-10.0, 10.0)
        self.eco2 += random.uniform(-20.0, 20.0)

        self.light += random.uniform(-30.0, 30.0)
        self.sound += random.uniform(-2.0, 2.0)
        self.uv += random.uniform(-0.2, 0.2)

        # Occasionally simulate rain
        if random.random() < 0.03:
            self.rain = not self.rain

        self._keep_values_realistic()

    def _keep_values_realistic(self):
        self.temperature = max(15.0, min(45.0, self.temperature))
        self.humidity = max(20.0, min(100.0, self.humidity))
        self.pressure = max(950.0, min(1050.0, self.pressure))

        self.aqi = max(0.0, min(500.0, self.aqi))
        self.tvoc = max(0.0, min(1000.0, self.tvoc))
        self.eco2 = max(400.0, min(5000.0, self.eco2))

        self.light = max(0.0, min(10000.0, self.light))
        self.sound = max(20.0, min(120.0, self.sound))
        self.uv = max(0.0, min(15.0, self.uv))

    def get_readings(self):
        return {
            "temperature": round(self.temperature, 2),
            "humidity": round(self.humidity, 2),
            "pressure": round(self.pressure, 2),
            "aqi": round(self.aqi, 2),
            "tvoc": round(self.tvoc, 2),
            "eco2": round(self.eco2, 2),
            "light": round(self.light, 2),
            "rain": self.rain,
            "sound": round(self.sound, 2),
            "uv": round(self.uv, 2),
        }