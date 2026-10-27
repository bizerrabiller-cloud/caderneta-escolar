# Caderneta Escolar

Site para o coordenador da escola registar alunos, pesquisar alunos e registar ocorrências.
Pensado para ser usado em vários dispositivos na rede local da escola.

## Tecnologias
- Backend: Python + Flask
- Base de dados: SQLite (incluído no Python)
- Frontend: HTML, CSS e JavaScript

## Estrutura
- `app.py` — arranque do servidor
- `db.py` — base de dados
- `routes/` — rotas de alunos e ocorrências
- `templates/` — páginas HTML
- `static/` — estilos (CSS) e scripts (JS)
- `data/` — ficheiro da base de dados

## Como arrancar
```
pip install -r requirements.txt
python app.py
```
