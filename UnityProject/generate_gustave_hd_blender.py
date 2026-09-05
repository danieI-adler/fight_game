import bpy
import math
import os

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_pbr_material(name, color, metallic=0.0, roughness=0.5, emission_color=None):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if emission_color:
            if "Emission Color" in bsdf.inputs:
                bsdf.inputs["Emission Color"].default_value = emission_color
                bsdf.inputs["Emission Strength"].default_value = 2.5
            elif "Emission" in bsdf.inputs:
                bsdf.inputs["Emission"].default_value = emission_color
    return mat

def create_gustave_high_detail():
    clear_scene()

    # --- MATERIAIS FIDEDIGNOS (SANDFALL CANONICAL) ---
    mat_black_coat = create_pbr_material("Mat_Black_Trenchcoat", (0.05, 0.05, 0.06, 1.0), 0.1, 0.7)
    mat_gold_embroidery = create_pbr_material("Mat_Gold_Embroidery", (0.92, 0.74, 0.22, 1.0), 0.95, 0.25)
    mat_purple_vest = create_pbr_material("Mat_Purple_Vest", (0.22, 0.08, 0.28, 1.0), 0.15, 0.6)
    mat_dark_pants = create_pbr_material("Mat_Dark_Pants", (0.08, 0.09, 0.12, 1.0), 0.05, 0.8)
    mat_leather_straps = create_pbr_material("Mat_Leather_Straps", (0.12, 0.08, 0.06, 1.0), 0.2, 0.45)
    mat_arm_metal = create_pbr_material("Mat_Mechanical_Arm", (0.18, 0.18, 0.2, 1.0), 0.95, 0.2)
    mat_arm_gold = create_pbr_material("Mat_Arm_GoldPistons", (0.95, 0.78, 0.25, 1.0), 0.95, 0.18)
    mat_cyan_core = create_pbr_material("Mat_Cyan_Core", (0.2, 0.85, 1.0, 1.0), 0.0, 0.05, (0.2, 0.85, 1.0, 1.0))
    mat_skin = create_pbr_material("Mat_Skin", (0.92, 0.76, 0.66, 1.0), 0.0, 0.55)
    mat_hair = create_pbr_material("Mat_Hair", (0.14, 0.09, 0.06, 1.0), 0.0, 0.85)

    # 1. TRONCO E COLETE ROXO COM ABOTOADURA DUPLA
    bpy.ops.mesh.primitive_cylinder_add(radius=0.30, depth=0.68, location=(0, 0, 1.15))
    vest = bpy.context.active_object
    vest.name = "Gustave_Vest"
    vest.data.materials.append(mat_purple_vest)

    # Botões e fios dourados no peito
    for i in range(5):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.015, depth=0.22, location=(0.08, 0.22, 1.35 - i * 0.08))
        trim = bpy.context.active_object
        trim.rotation_euler = (0, math.radians(90), 0)
        trim.data.materials.append(mat_gold_embroidery)

    # 2. SOBRETUDO LONGO BELLE ÉPOQUE (FRENTE ABERTA E CAUDA TRASEIRA)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.34, depth=0.85, location=(0, -0.05, 0.75))
    coat_tail = bpy.context.active_object
    coat_tail.name = "Gustave_CoatTails"
    coat_tail.scale = (1.1, 0.95, 1.0)
    coat_tail.data.materials.append(mat_black_coat)

    # Bordados dourados na barra do casaco
    bpy.ops.mesh.primitive_torus_add(major_radius=0.35, minor_radius=0.018, location=(0, -0.05, 0.35))
    coat_gold_trim = bpy.context.active_object
    coat_gold_trim.scale = (1.1, 0.95, 1.0)
    coat_gold_trim.data.materials.append(mat_gold_embroidery)

    # 3. GOLA / CACHECOL PRETO NO PESCOÇO
    bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.07, location=(0, 0, 1.48))
    scarf = bpy.context.active_object
    scarf.name = "Gustave_CowlScarf"
    scarf.data.materials.append(mat_black_coat)

    # 4. OMBREIRA DIREITA COM GRAVURAS EM OURO
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, location=(0.42, 0.02, 1.45))
    r_pauldron = bpy.context.active_object
    r_pauldron.name = "Gustave_Pauldron_Gold"
    r_pauldron.scale = (0.9, 1.1, 0.8)
    r_pauldron.data.materials.append(mat_gold_embroidery)

    # Aros de ouro no braço direito (armação mecânica)
    for i in range(3):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.02, location=(0.44, 0.02, 1.32 - i * 0.08))
        arm_ring = bpy.context.active_object
        arm_ring.data.materials.append(mat_arm_gold)

    # 5. BRAÇO MECÂNICO ESQUERDO / PRÓTESE METÁLICA ESCURA
    bpy.ops.mesh.primitive_cylinder_add(radius=0.09, depth=0.72, location=(-0.44, 0.02, 1.12))
    l_mech_arm = bpy.context.active_object
    l_mech_arm.name = "Gustave_Mechanical_Arm_Left"
    l_mech_arm.data.materials.append(mat_arm_metal)

    # Pistão e articulações de ouro da prótese
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.45, location=(-0.47, 0.06, 1.08))
    piston = bpy.context.active_object
    piston.data.materials.append(mat_arm_gold)

    # Manopla e dedos mecânicos
    bpy.ops.mesh.primitive_cube_add(size=0.16, location=(-0.44, 0.04, 0.72))
    mech_hand = bpy.context.active_object
    mech_hand.scale = (0.7, 1.1, 0.9)
    mech_hand.data.materials.append(mat_arm_metal)

    # Núcleo de energia elétrico ciano (Overcharge)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.05, location=(-0.44, 0.12, 1.15))
    core = bpy.context.active_object
    core.data.materials.append(mat_cyan_core)

    # 6. BRAÇO DIREITO (COM LUVA E FAIXAS DOURADAS)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.09, depth=0.68, location=(0.44, 0.02, 1.12))
    r_arm = bpy.context.active_object
    r_arm.name = "Gustave_Arm_Right"
    r_arm.data.materials.append(mat_black_coat)

    # 7. CABEÇA, CABELO CACHEADO E BIGODE CARACTERÍSTICO
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.20, location=(0, 0, 1.68))
    head = bpy.context.active_object
    head.name = "Gustave_Head"
    head.scale = (0.88, 1.04, 1.0)
    head.data.materials.append(mat_skin)

    # Cabelo ondulado com volume
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.23, location=(0, -0.03, 1.76))
    hair_top = bpy.context.active_object
    hair_top.name = "Gustave_Hair_Top"
    hair_top.scale = (0.95, 1.02, 0.8)
    hair_top.data.materials.append(mat_hair)

    # Mechas laterais
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(side * 0.19, -0.02, 1.68))
        hair_side = bpy.context.active_object
        hair_side.scale = (0.7, 1.2, 1.1)
        hair_side.data.materials.append(mat_hair)

    # Bigode e cavanhaque clássico
    bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.20, location=(0, 0.19, 1.61))
    mustache = bpy.context.active_object
    mustache.name = "Gustave_Mustache"
    mustache.rotation_euler = (0, math.radians(90), 0)
    mustache.data.materials.append(mat_hair)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045, location=(0, 0.18, 1.54))
    beard = bpy.context.active_object
    beard.data.materials.append(mat_hair)

    # 8. MOCHILA / ALFORJE DE COURO NAS COSTAS (EXPEDITION 33 PACK)
    bpy.ops.mesh.primitive_cube_add(size=0.34, location=(0, -0.26, 1.28))
    pack = bpy.context.active_object
    pack.name = "Gustave_Expedition_Backpack"
    pack.scale = (0.9, 0.6, 1.1)
    pack.rotation_euler = (math.radians(-12), 0, 0)
    pack.data.materials.append(mat_black_coat)

    # Tiras cruzadas no peito
    bpy.ops.mesh.primitive_cube_add(size=0.04, location=(0, 0.18, 1.22))
    strap = bpy.context.active_object
    strap.scale = (9.5, 0.2, 0.8)
    strap.rotation_euler = (0, 0, math.radians(40))
    strap.data.materials.append(mat_leather_straps)

    # 9. PERNAS, CALÇA ESCURA, FAIXAS DOURADAS NA COXA E CANELEIRAS
    for side in [-1, 1]:
        # Calça
        bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=0.75, location=(side * 0.16, 0, 0.48))
        leg = bpy.context.active_object
        leg.name = f"Gustave_Leg_{side}"
        leg.data.materials.append(mat_dark_pants)

        # Faixas douradas na coxa
        bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.016, location=(side * 0.16, 0, 0.68))
        thigh_gold = bpy.context.active_object
        thigh_gold.data.materials.append(mat_gold_embroidery)

        # Caneleiras / Bandagens pretas nos tornozelos
        bpy.ops.mesh.primitive_cylinder_add(radius=0.09, depth=0.35, location=(side * 0.16, 0.02, 0.28))
        wraps = bpy.context.active_object
        wraps.data.materials.append(mat_leather_straps)

        # Botas táticas Belle Époque
        bpy.ops.mesh.primitive_cube_add(size=0.22, location=(side * 0.16, 0.06, 0.11))
        boot = bpy.context.active_object
        boot.scale = (0.75, 1.35, 0.85)
        boot.data.materials.append(mat_leather_straps)

    # 10. UNIR EM OBJETO FINAL E EXPORTAR FBX
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.join()
    gustave_hd = bpy.context.active_object
    gustave_hd.name = "Gustave_ClairObscur_HD"

    return gustave_hd

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
    print(f"Exportado com sucesso para Unity: {filepath}")

if __name__ == "__main__":
    out_path = r"c:\Users\fogoy\Fight Game\UnityProject\Assets\Models\Gustave.fbx"
    create_gustave_high_detail()
    export_fbx(out_path)
