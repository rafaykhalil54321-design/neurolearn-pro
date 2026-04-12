# SLIM hata diya, ab full Python 3.10 use hoga (no missing files)
FROM python:3.10

# Install graphics libraries
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    libxcb1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files
COPY . .

# Start the app
CMD ["python", "main.py"]