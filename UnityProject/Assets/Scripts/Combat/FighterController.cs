using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using FightGame.Data;

namespace FightGame.Combat
{
    [RequireComponent(typeof(CharacterController))]
    public class FighterController : MonoBehaviour
    {
        [Header("Configurações do Lutador")]
        public CharacterData characterData;
        public bool isPlayer2 = false;
        public int facingDirection = 1; // 1 = Direita, -1 = Esquerda
        public FighterController opponent;

        [Header("Estado Atual")]
        public FighterState currentState = FighterState.Idle;
        public float currentHealth;
        public float currentEnergy;
        public int comboCounter = 0;

        [Header("Componentes")]
        public Hitbox activeHitbox;
        public Animator animator;
        private CharacterController controller;

        [Header("Física e Movimento")]
        private Vector3 moveVelocity;
        public float gravity = -35f;
        public bool isGrounded = true;
        private float hitstunTimer = 0f;
        private float stateTimer = 0f;

        [Header("Lista de Golpes")]
        public List<AttackData> attacks = new List<AttackData>();

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            currentHealth = characterData != null ? characterData.maxHealth : 1000f;
            currentEnergy = 0f;
        }

        [Header("Hierarquia Visual")]
        public Transform modelRoot;
        private Vector3 initialModelLocalPos;
        private Quaternion initialModelLocalRot;

        private void Start()
        {
            if (currentHealth <= 0)
            {
                currentHealth = characterData != null ? characterData.maxHealth : 1000f;
            }
            facingDirection = isPlayer2 ? -1 : 1;
            UpdateFacingRotation();

            if (modelRoot != null)
            {
                initialModelLocalPos = modelRoot.localPosition;
                initialModelLocalRot = modelRoot.localRotation;
            }
        }

        private void Update()
        {
            isGrounded = controller.isGrounded;
            stateTimer += Time.deltaTime;

            // 4. Ganho passivo de energia especial de 1% por segundo
            if (currentEnergy < 100f)
            {
                currentEnergy = Mathf.Min(100f, currentEnergy + 1.0f * Time.deltaTime);
            }

            if (hitstunTimer > 0)
            {
                hitstunTimer -= Time.deltaTime;
                if (hitstunTimer <= 0 && currentState == FighterState.Hurt)
                {
                    ChangeState(FighterState.Idle);
                }
            }

            AutoFaceOpponent();
            ApplyMovementAndGravity();
            UpdateAnimator();
            UpdateProceduralAnimation();
        }

        private void UpdateProceduralAnimation()
        {
            if (modelRoot == null) return;

            float t = Time.time * 5.0f;
            Vector3 targetPos = initialModelLocalPos;
            Vector3 targetEuler = Vector3.zero;

            switch (currentState)
            {
                case FighterState.Idle:
                    // Respiração de guarda e peso equilibrado
                    float breath = Mathf.Sin(t) * 0.04f;
                    targetPos += new Vector3(0, breath, 0);
                    targetEuler = new Vector3(Mathf.Sin(t * 0.5f) * 2.5f, 0, Mathf.Cos(t * 0.5f) * 1.8f);
                    break;

                case FighterState.WalkForward:
                    // Passada fluida de combate com oscilação do quadril e tronco
                    float stepFwd = Mathf.Sin(Time.time * 10f) * 0.08f;
                    float swayFwd = Mathf.Cos(Time.time * 10f) * 4f;
                    targetPos += new Vector3(0, Mathf.Abs(stepFwd), stepFwd * 0.4f);
                    targetEuler = new Vector3(8f, swayFwd, swayFwd * 0.5f);
                    break;

                case FighterState.WalkBack:
                    // Passada recuada em guarda defensiva
                    float stepBack = Mathf.Sin(Time.time * 9f) * 0.05f;
                    float swayBack = Mathf.Cos(Time.time * 9f) * 3f;
                    targetPos += new Vector3(0, Mathf.Abs(stepBack), -stepBack * 0.35f);
                    targetEuler = new Vector3(-6f, swayBack, -swayBack * 0.5f);
                    break;

                case FighterState.Block:
                case FighterState.CrouchBlock:
                    // Postura de bloqueio fechada com a lâmina/braço mecânico
                    targetPos += new Vector3(0, -0.12f, -0.18f);
                    targetEuler = new Vector3(12f, -15f, 5f);
                    break;

                case FighterState.Crouch:
                    // Agachamento estável
                    targetPos += new Vector3(0, -0.42f, 0);
                    targetEuler = new Vector3(10f, 0, 0);
                    break;

                case FighterState.Jump:
                case FighterState.JumpPunch:
                case FighterState.JumpKick:
                    // Postura acrobática aérea
                    targetEuler = new Vector3(-15f, 0, 0);
                    break;

                case FighterState.LightPunch:
                    // SOCO / CORTE RÁPIDO COM A ESPADA: Golpe cortante horizontal rápido
                    float slash1 = Mathf.Sin(Mathf.Clamp01(stateTimer / 0.22f) * Mathf.PI);
                    targetPos += new Vector3(0, 0.05f, slash1 * 0.55f);
                    targetEuler = new Vector3(slash1 * 18f, -slash1 * 35f, slash1 * 10f);
                    break;

                case FighterState.HeavyPunch:
                    // CORTE PESADO VERTICAL / ESTOCADA DE LÂMINA: Avanço poderoso com rotação total
                    float slash2 = Mathf.Sin(Mathf.Clamp01(stateTimer / 0.32f) * Mathf.PI);
                    targetPos += new Vector3(0, slash2 * 0.12f, slash2 * 0.75f);
                    targetEuler = new Vector3(slash2 * 28f, -slash2 * 45f, slash2 * 15f);
                    break;

                case FighterState.LightKick:
                    // CHUTE FRONTAL RÁPIDO: Extensão dinâmica da perna
                    float kick1 = Mathf.Sin(Mathf.Clamp01(stateTimer / 0.25f) * Mathf.PI);
                    targetPos += new Vector3(0, kick1 * 0.2f, kick1 * 0.5f);
                    targetEuler = new Vector3(-kick1 * 22f, 0, kick1 * 14f);
                    break;

                case FighterState.HeavyKick:
                    // CHUTE GIRATÓRIO ALTO: Rotação acrobática do corpo
                    float kick2 = Mathf.Sin(Mathf.Clamp01(stateTimer / 0.35f) * Mathf.PI);
                    targetPos += new Vector3(0, kick2 * 0.35f, kick2 * 0.6f);
                    targetEuler = new Vector3(-kick2 * 30f, kick2 * 60f, kick2 * 20f);
                    break;

                case FighterState.SpecialMove:
                    // TIRO COM A ARMA DE GUSTAVE (Rifle Aim & Recoil): Postura de mira e recuo balístico
                    float shootProg = stateTimer / 0.35f;
                    if (shootProg < 0.3f)
                    {
                        // Mira firme para frente
                        targetPos += new Vector3(0, 0.05f, 0.2f);
                        targetEuler = new Vector3(-8f, 25f, 0);
                    }
                    else
                    {
                        // Recuo do tiro
                        float recoil = Mathf.Sin(Mathf.Clamp01((shootProg - 0.3f) / 0.7f) * Mathf.PI);
                        targetPos += new Vector3(0, 0, -recoil * 0.35f);
                        targetEuler = new Vector3(-18f - recoil * 15f, 25f, 0);
                    }
                    break;

                case FighterState.SuperMove:
                    // OVERCHARGE SUPER (Salto, Sobrecarga e Disparo Devastador)
                    float superProg = Mathf.Sin(Mathf.Clamp01(stateTimer / 0.7f) * Mathf.PI);
                    targetPos += new Vector3(0, superProg * 0.6f, superProg * 0.9f);
                    targetEuler = new Vector3(superProg * 35f, superProg * 45f, superProg * 10f);
                    break;

                case FighterState.Hurt:
                    // Reação de impacto corporal
                    float hurtProg = Mathf.Sin(Mathf.Clamp01(stateTimer / 0.25f) * Mathf.PI);
                    targetPos += new Vector3(0, 0, -hurtProg * 0.4f);
                    targetEuler = new Vector3(-hurtProg * 25f, hurtProg * 10f, 0);
                    break;

                case FighterState.Knockdown:
                case FighterState.Defeat:
                    targetPos += new Vector3(0, -0.85f, -0.4f);
                    targetEuler = new Vector3(-80f, 0, 0);
                    break;
            }

            modelRoot.localPosition = Vector3.Lerp(modelRoot.localPosition, targetPos, Time.deltaTime * 20f);
            modelRoot.localRotation = Quaternion.Slerp(modelRoot.localRotation, initialModelLocalRot * Quaternion.Euler(targetEuler), Time.deltaTime * 20f);
        }

        public void HandleInput(float horizontalInput, bool crouch, bool jump, bool lightPunch, bool heavyPunch, bool lightKick, bool heavyKick, bool special, bool superMove, bool block = false)
        {
            if (hitstunTimer > 0 || currentState == FighterState.Knockdown || currentState == FighterState.Defeat) return;

            bool isAttacking = (currentState == FighterState.LightPunch || currentState == FighterState.HeavyPunch ||
                                currentState == FighterState.LightKick || currentState == FighterState.HeavyKick ||
                                currentState == FighterState.CrouchPunch || currentState == FighterState.CrouchKick ||
                                currentState == FighterState.JumpPunch || currentState == FighterState.JumpKick ||
                                currentState == FighterState.SpecialMove || currentState == FighterState.SuperMove);

            // Ataques com prioridade máxima
            if (superMove && currentEnergy >= 100f)
            {
                ExecuteAttack(FighterState.SuperMove);
                currentEnergy = 0f;
                return;
            }

            if (special)
            {
                // Disparo de Rifle do Gustave
                ExecuteAttack(FighterState.SpecialMove);
                return;
            }

            if (lightPunch && !isAttacking) { ExecuteAttack(crouch ? FighterState.CrouchPunch : (isGrounded ? FighterState.LightPunch : FighterState.JumpPunch)); return; }
            if (heavyPunch && !isAttacking) { ExecuteAttack(isGrounded ? FighterState.HeavyPunch : FighterState.JumpPunch); return; }
            if (lightKick && !isAttacking) { ExecuteAttack(crouch ? FighterState.CrouchKick : (isGrounded ? FighterState.LightKick : FighterState.JumpKick)); return; }
            if (heavyKick && !isAttacking) { ExecuteAttack(isGrounded ? FighterState.HeavyKick : FighterState.JumpKick); return; }

            if (isAttacking) return;

            // Bloqueio manual (Shift)
            if (block && isGrounded)
            {
                moveVelocity.x = 0;
                ChangeState(crouch ? FighterState.CrouchBlock : FighterState.Block);
                return;
            }

            float speed = characterData != null ? characterData.moveSpeed : 7f;

            // Pulo e Movimento
            if (isGrounded)
            {
                if (jump)
                {
                    moveVelocity.y = characterData != null ? characterData.jumpForce : 14f;
                    moveVelocity.x = horizontalInput * speed;
                    ChangeState(FighterState.Jump);
                }
                else if (crouch)
                {
                    moveVelocity.x = 0;
                    ChangeState(FighterState.Crouch);
                }
                else if (Mathf.Abs(horizontalInput) > 0.05f)
                {
                    moveVelocity.x = horizontalInput * speed;
                    bool movingForward = (facingDirection == 1 && horizontalInput > 0) || (facingDirection == -1 && horizontalInput < 0);
                    ChangeState(movingForward ? FighterState.WalkForward : FighterState.WalkBack);
                }
                else
                {
                    moveVelocity.x = 0;
                    ChangeState(FighterState.Idle);
                }
            }
            else
            {
                if (Mathf.Abs(horizontalInput) > 0.05f)
                {
                    moveVelocity.x = horizontalInput * speed;
                }
            }
        }

        private void ExecuteAttack(FighterState state)
        {
            AttackData attack = attacks.Find(a => a.targetState == state);
            if (attack == null)
            {
                float dmg = 50f;
                float startup = 0.06f;
                float active = 0.2f;
                float recov = 0.15f;

                if (state == FighterState.HeavyPunch) { dmg = 90f; startup = 0.1f; active = 0.25f; recov = 0.2f; }
                else if (state == FighterState.HeavyKick) { dmg = 100f; startup = 0.12f; active = 0.28f; recov = 0.22f; }
                else if (state == FighterState.SpecialMove) { dmg = 110f; startup = 0.12f; active = 0.2f; recov = 0.2f; }
                else if (state == FighterState.SuperMove) { dmg = 250f; startup = 0.18f; active = 0.35f; recov = 0.3f; }

                attack = new AttackData { targetState = state, damage = dmg, startupTime = startup, activeTime = active, recoveryTime = recov };
            }

            StartCoroutine(AttackCoroutine(attack));
        }

        private IEnumerator AttackCoroutine(AttackData attack)
        {
            ChangeState(attack.targetState);
            if (isGrounded) moveVelocity.x = 0;

            yield return new WaitForSeconds(attack.startupTime);

            // Se for golpe com a arma de tiro (SpecialMove), dispara projétil
            if (attack.targetState == FighterState.SpecialMove || attack.targetState == FighterState.SuperMove)
            {
                if (FightGame.VFX.HitVFXManager.Instance != null)
                {
                    Vector3 gunPos = transform.position + new Vector3(facingDirection * 0.8f, 1.35f, 0);
                    FightGame.VFX.HitVFXManager.Instance.SpawnGunProjectile(gunPos, facingDirection, Color.cyan, attack, this);
                }
            }
            else
            {
                if (activeHitbox != null)
                {
                    activeHitbox.Activate(attack, facingDirection);
                }
            }

            yield return new WaitForSeconds(attack.activeTime);

            if (activeHitbox != null)
            {
                activeHitbox.Deactivate();
            }

            yield return new WaitForSeconds(attack.recoveryTime);

            if (currentState == attack.targetState)
            {
                ChangeState(isGrounded ? FighterState.Idle : FighterState.Jump);
            }
        }

        public void OnReceiveHit(AttackData attack, FighterController attacker)
        {
            bool isBlocking = currentState == FighterState.Block || currentState == FighterState.CrouchBlock;

            if (isBlocking)
            {
                // Bloqueio absorve 80% do dano e não dá energia
                float chipDamage = (attack.damage * 0.2f) * (attacker.characterData != null ? attacker.characterData.attackMultiplier : 1f);
                currentHealth = Mathf.Max(0, currentHealth - chipDamage);
                hitstunTimer = attack.blockstunDuration;
                ApplyKnockback(attack.knockback * 0.4f, attacker.facingDirection);
            }
            else
            {
                float fullDamage = attack.damage * (attacker.characterData != null ? attacker.characterData.attackMultiplier : 1f);
                currentHealth = Mathf.Max(0, currentHealth - fullDamage);

                // Ganha 2.5% de energia ao apanhar, atacante ganha 5%
                currentEnergy = Mathf.Min(100f, currentEnergy + 2.5f);
                attacker.currentEnergy = Mathf.Min(100f, attacker.currentEnergy + 5.0f);
                attacker.comboCounter++;

                hitstunTimer = attack.hitstunDuration;
                ApplyKnockback(attack.knockback, attacker.facingDirection);
                ChangeState(attack.causesKnockdown ? FighterState.Knockdown : FighterState.Hurt);

                // Efeitos Visuais & Impacto Cinematográfico (Hitstop & VFX)
                if (FightGame.Combat.HitstopManager.Instance != null)
                {
                    FightGame.Combat.HitstopManager.Instance.TriggerHitstop(attack.isHeavy ? 0.08f : 0.04f, attack.isHeavy);
                }

                if (FightGame.VFX.HitVFXManager.Instance != null)
                {
                    Vector3 hitPos = (transform.position + attacker.transform.position) * 0.5f + Vector3.up * 1.2f;
                    FightGame.VFX.HitVFXManager.Instance.SpawnHitSpark(hitPos, attack.isHeavy, attacker.characterData != null ? attacker.characterData.themeColor : Color.yellow);
                }
            }

            if (currentHealth <= 0)
            {
                ChangeState(FighterState.Defeat);
                if (attacker != null) attacker.ChangeState(FighterState.Victory);
            }
        }

        private void ApplyKnockback(float force, int direction)
        {
            moveVelocity.x = force * direction;
        }

        private void ApplyMovementAndGravity()
        {
            if (controller.isGrounded && moveVelocity.y < 0)
            {
                moveVelocity.y = -6f; // Força de aderência firme ao chão
            }
            else
            {
                moveVelocity.y += gravity * Time.deltaTime;
            }

            Vector3 finalMove = moveVelocity;
            controller.Move(finalMove * Time.deltaTime);

            // Restringir sempre ao plano 2D Z=0
            Vector3 currentPos = transform.position;
            if (Mathf.Abs(currentPos.z) > 0.001f)
            {
                currentPos.z = 0f;
                transform.position = currentPos;
            }

            moveVelocity.x = Mathf.Lerp(moveVelocity.x, 0, Time.deltaTime * 12f);
        }

        private void AutoFaceOpponent()
        {
            if (opponent == null || currentState == FighterState.Hurt || currentState == FighterState.Knockdown) return;

            int desiredFacing = (opponent.transform.position.x > transform.position.x) ? 1 : -1;
            if (desiredFacing != facingDirection && isGrounded && (currentState == FighterState.Idle || currentState == FighterState.WalkForward || currentState == FighterState.WalkBack))
            {
                facingDirection = desiredFacing;
                UpdateFacingRotation();
            }
        }

        private void UpdateFacingRotation()
        {
            transform.rotation = Quaternion.Euler(0, facingDirection == 1 ? 90 : -90, 0);
        }

        public void ChangeState(FighterState newState)
        {
            if (currentState == newState) return;
            currentState = newState;
            stateTimer = 0f;
        }

        private void UpdateAnimator()
        {
            if (animator == null) return;
            animator.SetInteger("State", (int)currentState);
            animator.SetBool("IsGrounded", isGrounded);
        }
    }
}
