import random

GRID_SIZE = 10

TILE_EMPTY = "."
TILE_ROAD = "="
TILE_CITY_CENTER = "🏛️"
TILE_FOOD_BANK = "🔋"
TILE_HOUSE = "🏠"
TILE_HOUSE_FIRE = "🔥"
TILE_HOUSE_RUIN = "🏚️"

class CityMap:
    def __init__(self, size=GRID_SIZE):
        self.size = size
        self.grid = [[TILE_EMPTY for _ in range(size)] for _ in range(size)]
        
        # Fixed landmarks
        self.city_center = (4, 4)
        self.food_bank = (5, 5)
        
        self.grid[4][4] = TILE_CITY_CENTER
        self.grid[5][5] = TILE_FOOD_BANK
        
        # Roads connecting center
        for i in range(size):
            if i != 4 and i != 5:
                self.grid[4][i] = TILE_ROAD
                self.grid[i][5] = TILE_ROAD
                
        # Agent House Locations (assigned in ring around center)
        self.house_locations = {
            "Player_Commander": (1, 1),
            "Grok_1": (1, 8),
            "Grok_2": (2, 8),
            "Gemini_1": (8, 1),
            "Gemini_2": (8, 2),
            "ChatGPT_1": (1, 4),
            "ChatGPT_2": (2, 4),
            "Claude_1": (8, 8),
            "Claude_2": (8, 7),
            "Grok_3": (5, 8)
        }
        
        self.house_states = {agent_id: "INTACT" for agent_id in self.house_locations} # INTACT, ON_FIRE, RUIN
        
    def get_tile(self, x, y):
        if 0 <= x < self.size and 0 <= y < self.size:
            return self.grid[y][x]
        return None

    def set_house_state(self, agent_id, state):
        if agent_id in self.house_states:
            self.house_states[agent_id] = state

    def render_ascii(self, agents_dict):
        # Create visual snapshot map
        display_grid = [row[:] for row in self.grid]
        
        # Overlay houses with current state
        for agent_id, (hx, hy) in self.house_locations.items():
            state = self.house_states.get(agent_id, "INTACT")
            if state == "INTACT":
                display_grid[hy][hx] = TILE_HOUSE
            elif state == "ON_FIRE":
                display_grid[hy][hx] = TILE_HOUSE_FIRE
            else:
                display_grid[hy][hx] = TILE_HOUSE_RUIN
                
        # Overlay agents
        for agent_id, agent in agents_dict.items():
            if agent.alive:
                ax, ay = agent.pos
                display_grid[ay][ax] = agent.icon
                
        return display_grid
