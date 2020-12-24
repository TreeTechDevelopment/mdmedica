CREATE DATABASE mdmedica

USE mdmedica

CREATE TABLE clientes(
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL,
    edad INT NOT NULL,
    sangre VARCHAR(5) NOT NULL,
    direccion VARCHAR (200) NOT NULL,
    telefono VARCHAR(12) NOT NULL,
    contrasena VARCHAR(100) NOT NULL,
    email VARCHAR(40) NOT NULL,
    enfermedades VARCHAR(500) NOT NULL,
    enfermedadesFam VARCHAR(500) NOT NULL,
    contacto VARCHAR(12) NOT NULL,
    alergias VARCHAR(500) NOT NULL,
    confirmado BOOL DEFAULT 0,
    imagen VARCHAR(200) DEFAULT NULL,
    PRIMARY KEY (id)
)

CREATE TABLE servicios(
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(40) NOT NULL,
    descripcion TEXT NOT NULL,
    precio INT NOT NULL,
    olprecio INT NOT NULL,
    tipo INT NOT NULL,
    PRIMARY KEY (id)
    CONSTRAINT fk_tipo FOREIGN KEY (tipo) REFERENCES laboratorios(id)
)

CREATE TABLE laboratorios(
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(40) NOT NULL,
    descripcion TEXT NOT NULL,
    estrellas INT DEFAULT 0,
    imagen varchar(200) NOT NULL,
    PRIMARY KEY (id)
)

CREATE TABLE medicos(
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(40) NOT NULL,
    descripcion TEXT NOT NULL,
    estrellas INT DEFAULT 0,
    cargo VARCHAR(20) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    imagen VARCHAR(200) NOT NULL,
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
    cliente INT NOT NULL,
    estrellas INT DEFAULT 0,
    aprobado BOOL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_medico FOREIGN KEY (medico) REFERENCES medicos(id),
    CONSTRAINT fk_servicio FOREIGN KEY (servicio) REFERENCES servicios(id),
    CONSTRAINT fk_cleinte_review FOREIGN KEY (cliente) REFERENCES clientes(id)
)

CREATE TABLE citas(
    id INT NOT NULL AUTO_INCREMENT,
    fecha TIMESTAMP NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    edad INT NOT NULL,
    padecimiento VARCHAR(500) NOT NULL,
    telefono VARCHAR(12) NOT NULL,
    email VARCHAR(40) NOT NULL,
    direccion VARCHAR(200) DEFAULT NULL,
    cliente INT DEFAULT NULL,
    tipo BOOL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_cliente_cita FOREIGN KEY (cliente) REFERENCES clientes(id)
)

CREATE TABLE servicioCitas(
    id INT NOT NULL AUTO_INCREMENT,
    medico INT DEFAULT NULL,
    servicio INT DEFAULT NULL,
    cita INT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_cita FOREIGN KEY (cita) REFERENCES citas(id),
    CONSTRAINT fk_medico_cita FOREIGN KEY (medico) REFERENCES medicos(id),
    CONSTRAINT fk_servicio_cita FOREIGN KEY (servicio) REFERENCES servicios(id)
)

CREATE TABLE textos(
    id INT NOT NULL AUTO_INCREMENT,
    texto1 VARCHAR(200) DEFAULT NULL,
    texto2 VARCHAR(200) DEFAULT NULL,
    texto3 VARCHAR(200) DEFAULT NULL,
    PRIMARY KEY (id)
)

CREATE TABLE jwtBlockList(
    id INT NOT NULL AUTO_INCREMENT,
    token TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
)

INSERT INTO medicos (nombre, descripcion,estrellas,cargo,tipo,imagen) VALUES('NOMBRE MÉDICO', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', 4, 'Médico General', 'MEDICO', 'https://mdmedica.herokuapp.com/static/media/img7.jpg')

INSERT INTO laboratorios (nombre, descripcion,estrellas,imagen) VALUES('HEMATOLOGÍA', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', 4, 'http://localhost:3000/static/media/img8.jpg')

insert into servicios (nombre, descripcion, estrellas, precio, olprecio, tipo) values ('Biometría Hemática', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', 4, 100, 80, (select id from laboratorios where nombre = 'HEMATOLOGÍA'))

insert into clientes (nombre, apellido, edad, sangre, contrasena, email) values ('Nombre', 'Apellido', 35, 'B-', 'contrasena', 'prueba@gmail.com')

insert into reviews (texto, medico, cliente, estrellas) values ('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', 4, 1, 5)

insert into textos (texto1, texto2, texto3) values ('15% DE DESCUENTO', 'EN CUALQUIER SERVICIO', 'PAGANDO AQUÍ')