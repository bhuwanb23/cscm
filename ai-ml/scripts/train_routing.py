"""
Create a default CVRPTW config/preset file with common vehicle parameters.
CVRPTWSolver is an OR-Tools optimizer, not a trained ML model, so we save
a parameter preset for typical vehicle configurations.
"""
import sys, os, pickle
import logging

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'models'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models', 'routing_logistics', 'weights')
os.makedirs(WEIGHTS_DIR, exist_ok=True)


def main():
    logger.info("=== CVRPTW Config Preset Gen ===")

    try:
        from routing_logistics.classical_optimization import CVRPTWSolver
        solver = CVRPTWSolver(time_limit=30)
        has_ortools = True
    except Exception:
        logger.warning("OR-Tools not available — saving config preset only (no solver instantiation)")
        has_ortools = False

    default_config = {
        "description": "Default CVRPTW solver preset for standard supply chain routing",
        "solver_params": {
            "time_limit_seconds": 30,
            "first_solution_strategy": "PATH_CHEAPEST_ARC",
            "local_search_metaheuristic": "GUIDED_LOCAL_SEARCH",
        },
        "vehicle_defaults": {
            "capacity": 1000,
            "max_route_time_minutes": 480,
            "max_route_distance_units": 10000,
            "start_time_hours": 8.0,
            "service_time_minutes": 15,
        },
        "problem_defaults": {
            "use_time_windows": True,
            "use_capacity": True,
            "speed_units_per_hour": 50,
            "depot_location": {"x": 0, "y": 0},
        },
        "vehicle_profiles": [
            {"name": "standard_truck", "capacity": 1000, "max_route_time_minutes": 480, "start_time_hours": 8.0},
            {"name": "large_truck",   "capacity": 2000, "max_route_time_minutes": 600, "start_time_hours": 7.0},
            {"name": "small_van",     "capacity": 500,  "max_route_time_minutes": 360, "start_time_hours": 9.0},
        ],
    }

    if has_ortools:
        default_config["_solver_type"] = type(solver).__name__

    model_path = os.path.join(WEIGHTS_DIR, "cvrptw_default.pkl")
    with open(model_path, 'wb') as f:
        pickle.dump(default_config, f)
    logger.info(f"Config preset saved to {model_path}")
    logger.info(f"Profiles: {[p['name'] for p in default_config['vehicle_profiles']]}")

    return model_path


if __name__ == "__main__":
    main()
