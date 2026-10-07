FROM php:8.3-apache

RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo pdo_mysql
RUN a2enmod rewrite headers

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . /var/www/html

RUN chown -R www-data:www-data /var/www/html
RUN composer install --no-interaction --prefer-dist

COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

EXPOSE 80
