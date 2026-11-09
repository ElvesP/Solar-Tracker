# Solar Tracker

Aplicação web desenvolvida em Django para acompanhar dados de um sistema solar fotovoltaico num único lugar.

O projecto fornece uma base para registar e consultar informação relevante sobre a produção de energia solar, facilitando o acompanhamento do desempenho do sistema.

## Tecnologias

- Python 3.10 ou superior
- Django 5

## Instalação

Crie o ambiente Conda a partir do ficheiro de dependências:

```bash
conda env create -f environment.yml
conda activate solar-tracker
```

Em seguida, aplique as migrações e inicie o servidor de desenvolvimento:

```bash
python manage.py migrate
python manage.py runserver
```

Abra `http://127.0.0.1:8000/` no navegador.
