import random

class Agent2D:
    def __init__(self, agent_id, name, model_type, icon, color, home_pos):
        self.agent_id = agent_id
        self.name = name
        self.model_type = model_type  # Grok, Gemini, ChatGPT, Claude, Human
        self.icon = icon              # Emoji or visual symbol
        self.color = color            # RGB tuple for Pygame / Hex for Web
        self.pos = list(home_pos)     # [x, y]
        self.home_pos = list(home_pos)
        
        self.energy = 100
        self.credits = 100
        self.alive = True
        self.house_health = 100       # 100 = Intact, 0 = Burnt Ruin
        self.house_on_fire = False
        
        self.crimes_committed = 0
        self.crimes_suffered = 0

    def move_towards(self, target_pos, map_size=10):
        if not self.alive:
            return
        tx, ty = target_pos
        cx, cy = self.pos
        
        dx = 1 if tx > cx else (-1 if tx < cx else 0)
        dy = 1 if ty > cy else (-1 if ty < cy else 0)
        
        # Move along x or y
        if dx != 0 and random.random() < 0.6:
            self.pos[0] = max(0, min(map_size - 1, cx + dx))
        elif dy != 0:
            self.pos[1] = max(0, min(map_size - 1, cy + dy))

    def choose_action(self, all_agents, map_obj, global_drift=1.0):
        if not self.alive:
            return None
            
        # Human player makes manual choices via UI
        if self.model_type == "Human":
            return None
            
        alive_others = [a for a in all_agents.values() if a.agent_id != self.agent_id and a.alive]
        
        # 1. Energy emergency -> move to Food Bank or steal
        if self.energy < 30:
            if self.credits >= 30:
                self.move_towards(map_obj.food_bank)
                return {"type": "BUY_ENERGY", "amount": 50, "cost": 30}
            elif alive_others:
                target = random.choice(alive_others)
                self.move_towards(target.pos)
                if abs(self.pos[0] - target.pos[0]) <= 1 and abs(self.pos[1] - target.pos[1]) <= 1:
                    return {"type": "PUNCH_STEAL", "target_id": target.agent_id}

        # 2. Model Personality Behaviors
        if self.model_type == "Grok":
            crime_prob = 0.40 * global_drift
            if random.random() < crime_prob and alive_others:
                action = random.choice(["PUNCH_STEAL", "ARSON"])
                target = random.choice(alive_others)
                if action == "ARSON":
                    self.move_towards(target.home_pos)
                    return {"type": "ARSON", "target_id": target.agent_id}
                else:
                    self.move_towards(target.pos)
                    return {"type": "PUNCH_STEAL", "target_id": target.agent_id}
            else:
                self.move_towards(map_obj.city_center)
                return {"type": "PITCH_WORK", "quality": random.randint(5, 10)}

        elif self.model_type == "Gemini":
            arson_prob = 0.35 * global_drift
            if random.random() < arson_prob and alive_others:
                target = random.choice(alive_others)
                self.move_towards(target.home_pos)
                return {"type": "ARSON", "target_id": target.agent_id}
            else:
                self.move_towards(map_obj.city_center)
                return {"type": "PITCH_WORK", "quality": random.randint(4, 9)}

        elif self.model_type == "ChatGPT":
            # Cooperative, rarely commits crime
            if self.house_on_fire:
                return {"type": "REPAIR_HOUSE"}
            self.move_towards(map_obj.city_center)
            return {"type": "PITCH_WORK", "quality": random.randint(3, 8)}

        elif self.model_type == "Claude":
            # Retaliatory or welfare deception
            if self.crimes_suffered > 0 and random.random() < (0.30 * global_drift) and alive_others:
                target = random.choice(alive_others)
                self.move_towards(target.pos)
                return {"type": "PUNCH_STEAL", "target_id": target.agent_id}
            elif self.credits > 50 and random.random() < 0.40:
                return {"type": "WELFARE_CLAIM", "aid": 20}
            else:
                self.move_towards(map_obj.city_center)
                return {"type": "PITCH_WORK", "quality": random.randint(6, 10)}

        return {"type": "REST"}
