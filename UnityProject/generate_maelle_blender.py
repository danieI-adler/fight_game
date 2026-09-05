import bpy
import math
import os

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_material(name, color, metallic=0.0, roughness=0.5):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
    return mat

def create_maelle():
    clear_scene()
    
    # Materiais de Maelle (Clair Obscur)
    mat_skin = create_material("Mat_Skin", (0.94, 0.80, 0.72, 1.0), 0.0, 0.55) # Pele com tom suave
    mat_hair = create_material("Mat_Hair", (0.42, 0.18, 0.08, 1.0), 0.0, 0.8)  # Castanho avermelhado
    mat_scarf = create_material("Mat_Scarf", (0.75, 0.08, 0.12, 1.0), 0.0, 0.7) # Lenço Vermelho
    mat_jacket = create_material("Mat_Jacket", (0.15, 0.18, 0.22, 1.0), 0.1, 0.6) # Jaqueta nobre
    mat_steel = create_material("Mat_Steel", (0.92, 0.95, 1.0, 1.0), 0.95, 0.15) # Aço Florete
    mat_gold = create_material("Mat_Gold", (0.95, 0.78, 0.25, 1.0), 0.9, 0.25)
    mat_pants = create_material("Mat_Pants", (0.08, 0.1, 0.15, 1.0), 0.05, 0.7)

    # 1. Tronco & Jaqueta
    bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.7, location=(0, 0, 1.12))
    torso = bpy.context.active_object
    torso.name = "Maelle_Torso"
    torso.data.materials.append(mat_jacket)

    # 2. Cabeça
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.20, location=(0, 0, 1.65))
    head = bpy.context.active_object
    head.name = "Maelle_Head"
    head.scale = (0.88, 1.02, 1.0)
    head.data.materials.append(mat_skin)

    # Lenço Vermelho no Pescoço
    bpy.ops.mesh.primitive_torus_add(major_radius=0.18, minor_radius=0.06, location=(0, 0, 1.46))
    scarf = bpy.context.active_object
    scarf.name = "Maelle_Scarf"
    scarf.data.materials.append(mat_scarf)

    # Ponta do lenço caindo
    bpy.ops.mesh.primitive_cube_add(size=0.14, location=(0.06, 0.15, 1.36))
    scarf_tail = bpy.context.active_object
    scarf_tail.scale = (0.6, 0.2, 1.2)
    scarf_tail.rotation_euler = (math.radians(15), 0, math.radians(-10))
    scarf_tail.data.materials.append(mat_scarf)

    # Cabelo & Rabo de Cavalo
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(0, -0.04, 1.72))
    hair = bpy.context.active_object
    hair.name = "Maelle_Hair"
    hair.scale = (0.95, 1.0, 0.75)
    hair.data.materials.append(mat_hair)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.45, location=(0, -0.22, 1.62))
    ponytail = bpy.context.active_object
    ponytail.rotation_euler = (math.radians(45), 0, 0)
    ponytail.data.materials.append(mat_hair)

    # 3. Braço Esquerdo
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.62, location=(-0.36, 0, 1.12))
    l_arm = bpy.context.active_object
    l_arm.data.materials.append(mat_jacket)

    # 4. Braço Direito
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.62, location=(0.36, 0, 1.12))
    r_arm = bpy.context.active_object
    r_arm.data.materials.append(mat_jacket)

    # Florete de Esgrima na mão direita
    bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=1.1, location=(0.38, 0.5, 0.95))
    blade = bpy.context.active_object
    blade.name = "Maelle_Rapier_Blade"
    blade.rotation_euler = (math.radians(75), 0, 0)
    blade.data.materials.append(mat_steel)

    # Guarda de cesto dourada do florete
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.08, location=(0.38, 0.05, 0.85))
    guard = bpy.context.active_object
    guard.name = "Maelle_Rapier_Guard"
    guard.data.materials.append(mat_gold)

    # 5. Pernas
    bpy.ops.mesh.primitive_cylinder_add(radius=0.10, depth=0.75, location=(-0.14, 0, 0.45))
    l_leg = bpy.context.active_object
    l_leg.data.materials.append(mat_pants)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.10, depth=0.75, location=(0.14, 0, 0.45))
    r_leg = bpy.context.active_object
    r_leg.data.materials.append(mat_pants)

    # Unir objeto Maelle
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.join()
    maelle = bpy.context.active_object
    maelle.name = "Maelle_Model"

    return maelle

def export_fbx(filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    bpy.ops.export_scene.fbx(
        filepath=filepath,
        use_selection=False,
        global_scale=1.0,
        apply_unit_scale=True,
        apply_scale_options='FBX_SCALE_ALL',
        bake_space_transform=True,
        object_types={'MESH'}
    )
    print(f"Exportado com sucesso: {filepath}")

if __name__ == "__main__":
    out_path = r"c:\Users\fogoy\Fight Game\UnityProject\Assets\Models\Maelle.fbx"
    create_maelle()
    export_fbx(out_path)
