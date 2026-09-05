import bpy
import os

def analyze_mesh_details(fbx_path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    
    obj = bpy.context.selected_objects[0] if bpy.context.selected_objects else None
    if not obj:
        print("Nenhum objeto encontrado")
        return
        
    print(f"\n================ DETALHES DE: {os.path.basename(fbx_path)} ================")
    print(f"Dimensões (X, Y, Z): {obj.dimensions}")
    print(f"UV Layers: {[uv.name for uv in obj.data.uv_layers]}")
    print(f"Vertex Colors / Color Attributes: {[c.name for c in obj.data.color_attributes]}")
    print(f"Total de Materiais: {len(obj.data.materials)}")
    for i, m in enumerate(obj.data.materials):
        if m and m.use_nodes:
            textures = [node.image.name for node in m.node_tree.nodes if node.type == 'TEX_IMAGE' and node.image]
            print(f"  Material [{i}]: {m.name} | Texturas vinculadas: {textures}")
        else:
            print(f"  Material [{i}]: {m.name if m else 'None'}")

if __name__ == "__main__":
    f1 = r"C:\Users\fogoy\Downloads\Meshy_AI_Gilded_Duelist_0905180425_generate.fbx"
    f2 = r"C:\Users\fogoy\Downloads\Meshy_AI_Gilded_Shadow_Vanguar_0905180614_generate.fbx"
    analyze_mesh_details(f1)
    analyze_mesh_details(f2)
