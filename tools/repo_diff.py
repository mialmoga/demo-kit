import sys
import difflib
import os

def generar_diff_md(archivo_antiguo, archivo_nuevo, archivo_salida="diferencias.md"):
    """
    Compara dos archivos y genera un archivo Markdown con un diff estilo repositorio.
    """
    # 1. Validar que los archivos existan
    if not os.path.isfile(archivo_antiguo):
        print(f"Error: No se encontró el archivo base '{archivo_antiguo}'")
        return
    if not os.path.isfile(archivo_nuevo):
        print(f"Error: No se encontró el archivo modificado '{archivo_nuevo}'")
        return

    # 2. Leer el contenido de los archivos
    try:
        with open(archivo_antiguo, 'r', encoding='utf-8') as f1:
            lineas_antiguas = f1.readlines()
        with open(archivo_nuevo, 'r', encoding='utf-8') as f2:
            lineas_nuevas = f2.readlines()
    except Exception as e:
        print(f"Error al leer los archivos: {e}")
        return

    # 3. Generar el diff unificado
    # n=3 define el contexto de líneas que se muestran alrededor de los cambios
    diff = difflib.unified_diff(
        lineas_antiguas, 
        lineas_nuevas, 
        fromfile=archivo_antiguo, 
        tofile=archivo_nuevo, 
        lineterm=''
    )

    lineas_diff = list(diff)

    # 4. Comprobar si hay diferencias
    if not lineas_diff:
        print("Los archivos son idénticos. No hay diferencias para generar en el MD.")
        return

    # 5. Formatear la salida como Markdown estilo repositorio
    contenido_md = "# Comparación de Archivos\n\n"
    contenido_md += f"- **Archivo Base:** `{archivo_antiguo}`\n"
    contenido_md += f"- **Archivo Modificado:** `{archivo_nuevo}`\n\n"
    contenido_md += "```diff\n"
    
    for linea in lineas_diff:
        # Se remueven los saltos de línea finales para evitar dobles espacios en el bloque de código
        contenido_md += linea.rstrip('\n') + '\n'
        
    contenido_md += "```\n"

    # 6. Escribir el archivo Markdown resultante
    try:
        with open(archivo_salida, 'w', encoding='utf-8') as fs:
            fs.write(contenido_md)
        print(f"¡Éxito! El archivo Markdown con las diferencias se guardó en: {archivo_salida}")
    except Exception as e:
        print(f"Error al intentar guardar el archivo Markdown: {e}")

if __name__ == "__main__":
    # Manejo de argumentos desde la línea de comandos
    if len(sys.argv) < 3:
        print("Uso correcto: python repo_diff.py <archivo_base> <archivo_modificado> [archivo_salida.md]")
        sys.exit(1)
        
    arch1 = sys.argv[1]
    arch2 = sys.argv[2]
    # Si no se provee un tercer argumento, usa "diferencias.md" por defecto
    salida = sys.argv[3] if len(sys.argv) > 3 else "diferencias.md"
    
    generar_diff_md(arch1, arch2, salida)
