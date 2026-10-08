import csv
import json
import os
import re

csv_path = r"E:\cofre para opencode\Projetos\Destravando as Vendas\05-conteudo-cursos\markdowns\indice.csv"
output_dir = r"E:\cofre para opencode\Projetos\Destravando as Vendas\demo-unificado\area"

# Mapeamento de planos para cursos e módulos permitidos
PLAN_MODULES = {
    'starter': {
        'Afiliado Express': [],  # todos os módulos
        'Curso Marketplace (completo)': ['Ganhar como afiliado'],
    },
    'pro': {
        'Curso Marketplace (completo)': [
            'Comece aqui',
            'Trilha principal (Módulos 1 a 8)',
            'Produto e dinheiro',
            'Operar a loja',
            'IA pra gerenciar a loja',
            'Conteúdo e mídia',
            'Trilhas por plataforma',
            'Vender sem estoque',
            'Ferramentas e materiais',
            'Conclusão e certificado'
        ],
        'Ponto de Coleta': [],  # todos
    },
    'premium': {
        'Curso Marketplace (completo)': [],  # todos
        'Ponto de Coleta': [],
        'Afiliado Express': [],
    }
}

# Ler CSV
courses = {}
with open(csv_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        course_name = row['curso'].strip()
        module_name = row['modulo'].strip()
        lesson_order = int(row['ordem'])
        lesson_title = row['aula'].strip()
        video_url = row['video'].strip()
        
        if course_name not in courses:
            courses[course_name] = {}
        if module_name not in courses[course_name]:
            courses[course_name][module_name] = []
        
        # nome do arquivo local (unificado: videos na raiz)
        local_video = ''
        if video_url:
            filename = video_url.split('/')[-1]
            filename = re.sub(r'[^\w\-.]', '_', filename)
            local_video = f'../videos/{filename}'
        
        courses[course_name][module_name].append({
            'title': lesson_title,
            'order': lesson_order,
            'video_url': video_url,
            'local_video': local_video,
            'duration': '10:00'
        })

# Estruturar cursos
all_courses = []
for course_name, modules in courses.items():
    course_obj = {
        'id': re.sub(r'[^\w]', '-', course_name.lower()),
        'name': course_name,
        'modules': []
    }
    for module_name, lessons in modules.items():
        module_obj = {
            'id': re.sub(r'[^\w]', '-', module_name.lower()),
            'name': module_name,
            'order': 0,
            'lessons': sorted(lessons, key=lambda x: x['order'])
        }
        course_obj['modules'].append(module_obj)
    course_obj['modules'].sort(key=lambda x: x['name'])
    all_courses.append(course_obj)

# Planos (tudo liberado para demo sem login)
plans = [
    {
        'id': 'starter',
        'name': 'STARTER',
        'subtitle': 'Afiliado Express',
        'price': 'R$ 49,90',
        'installments': '3x de R$ 16,63',
        'description': 'Comece a ganhar sem estoque, sem CNPJ e sem risco.',
        'courses': [
            {
                'course_id': re.sub(r'[^\w]', '-', 'Afiliado Express'.lower()),
                'allowed_modules': []
            },
            {
                'course_id': re.sub(r'[^\w]', '-', 'Curso Marketplace (completo)'.lower()),
                'allowed_modules': [re.sub(r'[^\w]', '-', m.lower()) for m in PLAN_MODULES['starter']['Curso Marketplace (completo)']]
            }
        ],
        'features': [
            'Afiliado Express completo',
            'Módulo Ganhar como Afiliado',
            'Prompts de IA para afiliados',
            'Roteiros prontos para redes sociais',
            'Planilha de controle de afiliado'
        ],
        'recommended': False
    },
    {
        'id': 'pro',
        'name': 'PRO',
        'subtitle': 'Seller Completo',
        'price': 'R$ 97,90',
        'installments': '3x de R$ 32,63',
        'description': 'Monte sua loja própria e venda em Shopee, Shein, TikTok Shop, Kwai e Temu.',
        'courses': [
            {
                'course_id': re.sub(r'[^\w]', '-', 'Curso Marketplace (completo)'.lower()),
                'allowed_modules': [re.sub(r'[^\w]', '-', m.lower()) for m in PLAN_MODULES['pro']['Curso Marketplace (completo)']]
            },
            {
                'course_id': re.sub(r'[^\w]', '-', 'Ponto de Coleta'.lower()),
                'allowed_modules': []
            }
        ],
        'features': [
            'Curso Marketplace completo',
            'Ponto de Coleta',
            'Planilhas do Seller',
            'Prompts de IA para loja',
            'Banco de ganchos e roteiros',
            'Checklists de lançamento'
        ],
        'recommended': True
    },
    {
        'id': 'premium',
        'name': 'PREMIUM',
        'subtitle': 'Empreendedor Digital',
        'price': 'R$ 147,90',
        'installments': '3x de R$ 49,30',
        'description': 'Domine todos os caminhos: seller, afiliado, ponto de coleta e importação.',
        'courses': [
            {
                'course_id': re.sub(r'[^\w]', '-', 'Curso Marketplace (completo)'.lower()),
                'allowed_modules': []
            },
            {
                'course_id': re.sub(r'[^\w]', '-', 'Ponto de Coleta'.lower()),
                'allowed_modules': []
            },
            {
                'course_id': re.sub(r'[^\w]', '-', 'Afiliado Express'.lower()),
                'allowed_modules': []
            }
        ],
        'features': [
            'Tudo do plano PRO',
            'Afiliado Express',
            'Módulo Importar da China (quando liberado)',
            'Automação de loja com n8n',
            'Kit do Seller',
            'Atualizações antecipadas'
        ],
        'recommended': False
    }
]

output = {
    'courses': all_courses,
    'plans': plans
}

output_path = os.path.join(output_dir, 'data.js')
with open(output_path, 'w', encoding='utf-8') as f:
    f.write('const PLATFORM_DATA = ')
    json.dump(output, f, ensure_ascii=False, indent=2)
    f.write(';\n')

print(f'Dados salvos em: {output_path}')
print(f'Cursos: {len(all_courses)}')
for c in all_courses:
    print(f"  - {c['name']}: {len(c['modules'])} módulos, {sum(len(m['lessons']) for m in c['modules'])} aulas")
