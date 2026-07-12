FROM nginx:alpine

# Remove default nginx configuration
RUN rm -rf /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy application static files to Nginx web directory
COPY . /usr/share/nginx/html/

# Expose port 80
EXPOSE 80
