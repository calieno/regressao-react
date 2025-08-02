import csv
import random

# Máximos teóricos para normalização
max_tamanho = 350
max_banheiros = 5
max_quartos = 6
max_preco = 200000

with open("dados_normalizados350k.csv", "w", newline='') as arquivo:
    escritor = csv.writer(arquivo)
    escritor.writerow(['tamanho', 'banheiros', 'quartos', 'preco'])

    for _ in range(10000):
        tamanho = random.randint(30, max_tamanho)
        banheiros = random.randint(1, max_banheiros)
        quartos = random.randint(1, max_quartos)

        # Fórmula simulada com ruído aleatório
        preco = (
            tamanho * 4000 +
            banheiros * 10000 +
            quartos * 15000 +
            random.randint(-50000, 50000)
        )

        # Normalização simples (valores entre 0 e ~1)
        tamanho_norm = round(tamanho / max_tamanho, 4)
        banheiros_norm = round(banheiros / max_banheiros, 4)
        quartos_norm = round(quartos / max_quartos, 4)
        preco_norm = round(preco / max_preco, 6)

        escritor.writerow([tamanho_norm, banheiros_norm, quartos_norm, preco_norm])
