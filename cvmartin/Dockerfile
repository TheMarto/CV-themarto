# Imagen base de NGINX
FROM nginx:alpine

# Borra configuración por defecto de NGINX (opcional pero limpio)
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copia configuración personalizada (la crearemos luego)
COPY nginx.conf /etc/nginx/conf.d

# Copia el contenido del build Angular al root de nginx
COPY ../dist/cvmartin/browser/ /usr/share/nginx/html

# Expone el puerto 80
EXPOSE 80

# Inicia nginx en modo foreground
CMD ["nginx", "-g", "daemon off;"]
