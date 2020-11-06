CREATE DATABASE mdmedica

USE mdmedica

CREATE TABLE clientes(
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(40) NOT NULL,
    apellido VARCHAR(40) NOT NULL,
    edad INT NOT NULL,
    sangre VARCHAR(10) NOT NULL,
    contrasena VARCHAR(40) NOT NULL,
    email VARCHAR(40) NOT NULL,
    PRIMARY KEY (id)
)

CREATE TABLE servicios(
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(40) NOT NULL,
    descripcion TEXT NOT NULL,
    estrellas INT DEFAULT 0,
    PRIMARY KEY (id)
)

CREATE TABLE medicos(
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(40) NOT NULL,
    descripcion TEXT NOT NULL,
    estrellas INT DEFAULT 0,
    cargo VARCHAR(20) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    imagen VARCHAR(50) NOT NULL,
    PRIMARY KEY (id)
)

CREATE TABLE usuarios(
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(40) NOT NULL,
    apellido VARCHAR(40) NOT NULL,
    usuario VARCHAR(40) NOT NULL,
    contraseña VARCHAR(40) NOT NULL,
    tipo VARCHAR(10) NOT NULL,
    PRIMARY KEY (id)
)

CREATE TABLE reviews(
    id INT NOT NULL AUTO_INCREMENT,
    texto TEXT NOT NULL,
    medico INT DEFAULT NULL,
    servicio INT DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_medico FOREIGN KEY (medico) REFERENCES medicos(id),
    CONSTRAINT fk_servicio FOREIGN KEY (servicio) REFERENCES servicios(id)
)

CREATE TABLE citas(
    id INT NOT NULL AUTO_INCREMENT,
    cliente INT NOT NULL,
    medico INT DEFAULT NULL,
    servicio INT DEFAULT NULL,
    fecha TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_medico_cita FOREIGN KEY (medico) REFERENCES medicos(id),
    CONSTRAINT fk_cliente FOREIGN KEY (cliente) REFERENCES clientes(id),
    CONSTRAINT fk_servicio_cita FOREIGN KEY (servicio) REFERENCES servicios(id)
)