from flask import Flask, jsonify, request
from flask_cors import CORS
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Habilita CORS para todas as rotas

# --- Dados em Memória ---
users_db = {
    "admin": {
        "id": str(uuid.uuid4()),
        "username": "admin",
        # Para um backend real, armazene hashes de senha!
        "password": "password123"
    }
}

trucks_db = []
collection_points_db = []
routes_db = []
itineraries_db = []

# --- Helper para Respostas da API ---
def create_api_response(success, data=None, message=None, errors=None):
    response = {"success": success}
    if data is not None:
        response["data"] = data
    if message is not None:
        response["message"] = message
    if errors is not None:
        response["errors"] = errors
    return jsonify(response)

# --- Autenticação ---
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    # No frontend, o campo é 'passwordHash', mas aqui esperamos a senha real para simplificar
    password = data.get('passwordHash') # ou data.get('password') se o frontend enviar 'password'

    user = users_db.get(username)
    if user and user['password'] == password:
        # Em um sistema real, gere um token JWT seguro
        dummy_token = str(uuid.uuid4())
        user_info = {"id": user["id"], "username": user["username"]}
        return create_api_response(True, data={"token": dummy_token, "user": user_info}, message="Login successful")
    return create_api_response(False, message="Invalid credentials"), 401

# --- Caminhões (Trucks) ---
@app.route('/api/trucks', methods=['GET', 'POST'])
def handle_trucks():
    if request.method == 'POST':
        data = request.get_json()
        if not data.get('licensePlate'):
            return create_api_response(False, message="License plate is required"), 400
        
        # Verifica se placa já existe (simulando constraint de unicidade )
        if any(t['licensePlate'] == data['licensePlate'] for t in trucks_db):
             return create_api_response(False, message=f"Truck with license plate {data['licensePlate']} already exists."), 409


        new_truck = {
            "id": str(uuid.uuid4()),
            "licensePlate": data.get('licensePlate'),
            "driverName": data.get('driverName'),
            "capacity": data.get('capacity'),
            "capacityUnit": data.get('capacityUnit'),
            "allowedResidueTypes": data.get('allowedResidueTypes', [])
        }
        trucks_db.append(new_truck)
        return create_api_response(True, data=new_truck, message="Truck created successfully"), 201
    
    # GET
    return create_api_response(True, data=trucks_db)

@app.route('/api/trucks/<string:truck_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_truck(truck_id):
    truck = next((t for t in trucks_db if t['id'] == truck_id), None)
    if not truck:
        return create_api_response(False, message="Truck not found"), 404

    if request.method == 'GET':
        return create_api_response(True, data=truck)

    if request.method == 'PUT':
        data = request.get_json()
        # Verifica unicidade da placa se ela for alterada e diferente da original
        if 'licensePlate' in data and data['licensePlate'] != truck['licensePlate']:
            if any(t['licensePlate'] == data['licensePlate'] for t in trucks_db):
                 return create_api_response(False, message=f"Truck with license plate {data['licensePlate']} already exists."), 409
        
        truck.update(data)
        return create_api_response(True, data=truck, message="Truck updated successfully")

    if request.method == 'DELETE':
        # Regra de negócio: não pode excluir caminhão em uso  (simulação simplificada)
        if any(it['truckId'] == truck_id for it in itineraries_db):
             return create_api_response(False, message="Cannot delete truck: it is currently assigned to an itinerary."), 400
        
        trucks_db.remove(truck)
        return create_api_response(True, message="Truck deleted successfully"), 200 # Ou 204 No Content

# --- Pontos de Coleta (Collection Points) ---
@app.route('/api/collection-points', methods=['GET', 'POST'])
def handle_collection_points():
    if request.method == 'POST':
        data = request.get_json()
        if not data.get('name'):
            return create_api_response(False, message="Collection point name is required"), 400
        
        # Verifica nome único 
        if any(cp['name'] == data['name'] for cp in collection_points_db):
            return create_api_response(False, message=f"Collection point with name '{data['name']}' already exists."), 409

        new_point = {
            "id": str(uuid.uuid4()),
            "name": data.get('name'),
            "responsibleName": data.get('responsibleName'),
            "contactInfo": data.get('contactInfo'),
            "address": data.get('address'),
            "acceptedResidueTypes": data.get('acceptedResidueTypes', [])
        }
        collection_points_db.append(new_point)
        return create_api_response(True, data=new_point, message="Collection point created successfully"), 201
    
    # GET
    return create_api_response(True, data=collection_points_db)

@app.route('/api/collection-points/<string:point_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_collection_point(point_id):
    point = next((cp for cp in collection_points_db if cp['id'] == point_id), None)
    if not point:
        return create_api_response(False, message="Collection point not found"), 404

    if request.method == 'GET':
        return create_api_response(True, data=point)

    if request.method == 'PUT':
        data = request.get_json()
        if 'name' in data and data['name'] != point['name']:
            if any(cp['name'] == data['name'] for cp in collection_points_db):
                return create_api_response(False, message=f"Collection point with name '{data['name']}' already exists."), 409
        
        point.update(data)
        return create_api_response(True, data=point, message="Collection point updated successfully")

    if request.method == 'DELETE':
        # Regra de negócio: não pode excluir ponto em uso  (simulação simplificada)
        # Verifica se o ponto está em alguma rota (mais complexo, pois rotas têm 'orderedPoints')
        # Por simplicidade, essa verificação não está completa aqui.
        # if any(point_id in route_definition for route in routes_db):
        #     return create_api_response(False, message="Cannot delete point: it is part of an active route/itinerary."), 400
        
        collection_points_db.remove(point)
        return create_api_response(True, message="Collection point deleted successfully")


# --- Rotas (Routes) ---
@app.route('/api/routes', methods=['GET', 'POST'])
def handle_routes():
    if request.method == 'POST':
        data = request.get_json() # Espera { name, truckId, collectionPointIds }
        if not data.get('name') or not data.get('truckId') or not data.get('collectionPointIds'):
            return create_api_response(False, message="Name, truckId, and collectionPointIds are required for a route"), 400
        if len(data['collectionPointIds']) < 2:
            return create_api_response(False, message="A route must have at least 2 collection points"), 400

        # Simulação de cálculo de rota e compatibilidade de resíduos
        ordered_points_simulated = []
        total_distance_simulated = 0
        serviced_residue_types_simulated = set()

        # Verifica se o caminhão existe
        assigned_truck = next((t for t in trucks_db if t['id'] == data['truckId']), None)
        if not assigned_truck:
            return create_api_response(False, message=f"Truck with ID {data['truckId']} not found."), 404

        for point_id in data['collectionPointIds']:
            point_obj = next((cp for cp in collection_points_db if cp['id'] == point_id), None)
            if point_obj:
                ordered_points_simulated.append({"neighborhoodName": point_obj['name'], "id": point_id}) # Simulação do RoutePoint
                total_distance_simulated += 10 # Distância dummy
                for res_type in point_obj['acceptedResidueTypes']:
                    serviced_residue_types_simulated.add(res_type)
            else:
                return create_api_response(False, message=f"Collection point ID {point_id} not found."), 400
        
        # Validação de compatibilidade de resíduos 
        truck_allowed_residues = set(assigned_truck.get('allowedResidueTypes', []))
        if not serviced_residue_types_simulated.issubset(truck_allowed_residues):
            return create_api_response(False, message="Assigned truck is not compatible with all residue types in the selected collection points."), 400


        new_route = {
            "id": str(uuid.uuid4()),
            "name": data.get('name'),
            "truckId": data.get('truckId'),
            "collectionPointIds_input": data.get('collectionPointIds'), # Armazena o input original
            # Campos "calculados" simulados
            "orderedPoints": ordered_points_simulated,
            "orderedEdges": [], # Simulação, poderia ser lista de {"from": "A", "to": "B", "distanceKm": 10}
            "totalDistanceKm": total_distance_simulated,
            "servicedResidueTypes": list(serviced_residue_types_simulated)
        }
        routes_db.append(new_route)
        return create_api_response(True, data=new_route, message="Route created and calculated (simulated) successfully"), 201
    
    # GET
    return create_api_response(True, data=routes_db)

@app.route('/api/routes/<string:route_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_route(route_id):
    route = next((r for r in routes_db if r['id'] == route_id), None)
    if not route:
        return create_api_response(False, message="Route not found"), 404

    if request.method == 'GET':
        return create_api_response(True, data=route)

    if request.method == 'PUT':
        data = request.get_json() # Espera { name, truckId, collectionPointIds }
        
        # Simulação de recálculo de rota se collectionPointIds ou truckId mudar
        recalculate = False
        if 'collectionPointIds' in data and data['collectionPointIds'] != route.get('collectionPointIds_input', []):
            recalculate = True
        if 'truckId' in data and data['truckId'] != route.get('truckId'):
            recalculate = True
        
        if recalculate:
            # Pega os novos valores ou mantém os antigos se não forem fornecidos
            new_point_ids = data.get('collectionPointIds', route.get('collectionPointIds_input', []))
            new_truck_id = data.get('truckId', route.get('truckId'))

            if len(new_point_ids) < 2:
                 return create_api_response(False, message="A route must have at least 2 collection points"), 400

            ordered_points_simulated = []
            total_distance_simulated = 0
            serviced_residue_types_simulated = set()

            assigned_truck = next((t for t in trucks_db if t['id'] == new_truck_id), None)
            if not assigned_truck:
                return create_api_response(False, message=f"Truck with ID {new_truck_id} not found."), 404

            for point_id in new_point_ids:
                point_obj = next((cp for cp in collection_points_db if cp['id'] == point_id), None)
                if point_obj:
                    ordered_points_simulated.append({"neighborhoodName": point_obj['name'], "id": point_id})
                    total_distance_simulated += 10
                    for res_type in point_obj['acceptedResidueTypes']:
                        serviced_residue_types_simulated.add(res_type)
                else:
                    return create_api_response(False, message=f"Collection point ID {point_id} not found."), 400
            
            truck_allowed_residues = set(assigned_truck.get('allowedResidueTypes', []))
            if not serviced_residue_types_simulated.issubset(truck_allowed_residues):
                return create_api_response(False, message="Assigned truck is not compatible with all residue types in the selected collection points."), 400
            
            route['collectionPointIds_input'] = new_point_ids
            route['orderedPoints'] = ordered_points_simulated
            route['totalDistanceKm'] = total_distance_simulated
            route['servicedResidueTypes'] = list(serviced_residue_types_simulated)

        # Atualiza outros campos como nome e truckId diretamente
        if 'name' in data:
            route['name'] = data['name']
        if 'truckId' in data: # truckId pode ter sido atualizado já se recalculate = true
            route['truckId'] = data['truckId']

        return create_api_response(True, data=route, message="Route updated successfully")

    if request.method == 'DELETE':
        if any(it['routeId'] == route_id for it in itineraries_db):
             return create_api_response(False, message="Cannot delete route: it is currently scheduled in an itinerary."), 400
        routes_db.remove(route)
        return create_api_response(True, message="Route deleted successfully")

# --- Itinerários (Itineraries) ---
@app.route('/api/itineraries', methods=['GET', 'POST'])
def handle_itineraries():
    if request.method == 'POST':
        data = request.get_json() # Espera { routeId, truckId, collectionDate }
        if not data.get('routeId') or not data.get('truckId') or not data.get('collectionDate'):
            return create_api_response(False, message="routeId, truckId, and collectionDate are required"), 400

        # Validação: Um caminhão não pode ser designado a mais de um itinerário no mesmo dia 
        truck_id = data.get('truckId')
        collection_date = data.get('collectionDate')
        if any(it['truckId'] == truck_id and it['collectionDate'] == collection_date for it in itineraries_db):
            return create_api_response(False, message=f"Truck ID {truck_id} is already scheduled on {collection_date}."), 409
        
        # Validar se a rota existe
        assigned_route = next((r for r in routes_db if r['id'] == data['routeId']), None)
        if not assigned_route:
            return create_api_response(False, message=f"Route with ID {data['routeId']} not found."), 404
        
        # Validar se o caminhão existe
        assigned_truck = next((t for t in trucks_db if t['id'] == data['truckId']), None)
        if not assigned_truck:
            return create_api_response(False, message=f"Truck with ID {data['truckId']} not found."), 404

        # Validar compatibilidade do caminhão com os resíduos da rota 
        route_residues = set(assigned_route.get('servicedResidueTypes', []))
        truck_residues = set(assigned_truck.get('allowedResidueTypes', []))
        if not route_residues.issubset(truck_residues):
            return create_api_response(False, message=f"Truck {assigned_truck['licensePlate']} is not compatible with all residue types of route '{assigned_route['name']}'."), 400


        new_itinerary = {
            "id": str(uuid.uuid4()),
            "routeId": data.get('routeId'),
            "truckId": truck_id,
            "collectionDate": collection_date
        }
        itineraries_db.append(new_itinerary)
        return create_api_response(True, data=new_itinerary, message="Itinerary scheduled successfully"), 201
    
    # GET
    filter_date = request.args.get('date')
    filter_truck_id = request.args.get('truckId')
    # O filtro por collectionPointId no GET de itinerários é mais complexo,
    # pois exigiria buscar as rotas que contêm o ponto e depois os itinerários dessas rotas.
    # Para simplificar, não será implementado neste backend de teste.

    filtered_itineraries = itineraries_db
    if filter_date:
        filtered_itineraries = [it for it in filtered_itineraries if it['collectionDate'] == filter_date]
    if filter_truck_id:
        filtered_itineraries = [it for it in filtered_itineraries if it['truckId'] == filter_truck_id]
        
    return create_api_response(True, data=filtered_itineraries)

@app.route('/api/itineraries/<string:itinerary_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_itinerary(itinerary_id):
    itinerary = next((it for it in itineraries_db if it['id'] == itinerary_id), None)
    if not itinerary:
        return create_api_response(False, message="Itinerary not found"), 404

    if request.method == 'GET':
        return create_api_response(True, data=itinerary)

    if request.method == 'PUT':
        data = request.get_json()
        
        original_truck_id = itinerary['truckId']
        original_collection_date = itinerary['collectionDate']

        new_truck_id = data.get('truckId', original_truck_id)
        new_collection_date = data.get('collectionDate', original_collection_date)
        new_route_id = data.get('routeId', itinerary['routeId'])

        # Se houve mudança no caminhão ou na data, verificar conflito
        if new_truck_id != original_truck_id or new_collection_date != original_collection_date:
            if any(it['truckId'] == new_truck_id and \
                     it['collectionDate'] == new_collection_date and \
                     it['id'] != itinerary_id # Excluir o próprio itinerário da verificação
                     for it in itineraries_db):
                return create_api_response(False, message=f"Truck ID {new_truck_id} is already scheduled on {new_collection_date}."), 409

        # Validar se a rota existe
        assigned_route = next((r for r in routes_db if r['id'] == new_route_id), None)
        if not assigned_route:
            return create_api_response(False, message=f"Route with ID {new_route_id} not found."), 404
        
        # Validar se o caminhão existe
        assigned_truck = next((t for t in trucks_db if t['id'] == new_truck_id), None)
        if not assigned_truck:
            return create_api_response(False, message=f"Truck with ID {new_truck_id} not found."), 404

        # Validar compatibilidade do caminhão com os resíduos da rota
        route_residues = set(assigned_route.get('servicedResidueTypes', []))
        truck_residues = set(assigned_truck.get('allowedResidueTypes', []))
        if not route_residues.issubset(truck_residues):
            return create_api_response(False, message=f"Truck {assigned_truck['licensePlate']} is not compatible with all residue types of route '{assigned_route['name']}'."), 400


        itinerary.update(data) # Atualiza todos os campos enviados
        return create_api_response(True, data=itinerary, message="Itinerary updated successfully")

    if request.method == 'DELETE':
        itineraries_db.remove(itinerary)
        return create_api_response(True, message="Itinerary deleted successfully")

if __name__ == '__main__':
    # Adicionar alguns dados de exemplo para teste inicial
    # Caminhões
    truck1_id = str(uuid.uuid4())
    trucks_db.append({"id": truck1_id, "licensePlate": "TRK-001", "driverName": "Carlos Silva", "capacity": 5000, "capacityUnit": "kg", "allowedResidueTypes": ["plástico", "papel", "metal"]})
    truck2_id = str(uuid.uuid4())
    trucks_db.append({"id": truck2_id, "licensePlate": "TRK-002", "driverName": "Ana Pereira", "capacity": 7000, "capacityUnit": "kg", "allowedResidueTypes": ["orgânico", "vidro"]})
    truck3_id = str(uuid.uuid4())
    trucks_db.append({"id": truck3_id, "licensePlate": "TRK-003", "driverName": "Jorge Lima", "capacity": 6000, "capacityUnit": "kg", "allowedResidueTypes": ["plástico", "papel", "metal", "orgânico", "vidro"]})


    # Pontos de Coleta
    cp1_id = str(uuid.uuid4())
    collection_points_db.append({"id": cp1_id, "name": "Centro Cívico", "responsibleName": "Resp Cívico", "contactInfo": "123", "address": "Rua A", "acceptedResidueTypes": ["papel", "plástico"]})
    cp2_id = str(uuid.uuid4())
    collection_points_db.append({"id": cp2_id, "name": "Parque Ambiental", "responsibleName": "Resp Parque", "contactInfo": "456", "address": "Rua B", "acceptedResidueTypes": ["orgânico", "vidro"]})
    cp3_id = str(uuid.uuid4())
    collection_points_db.append({"id": cp3_id, "name": "Shopping Flores", "responsibleName": "Resp Shopping", "contactInfo": "789", "address": "Rua C", "acceptedResidueTypes": ["metal", "plástico"]})
    cp4_id = str(uuid.uuid4())
    collection_points_db.append({"id": cp4_id, "name": "Jardim das Palmeiras Ponto", "responsibleName": "Resp JP", "contactInfo": "101", "address": "Rua JP", "acceptedResidueTypes": ["papel"]})


    # Rotas (simuladas)
    route1_id = str(uuid.uuid4())
    routes_db.append({
        "id": route1_id, "name": "Rota Centro-Norte", "truckId": truck1_id,
        "collectionPointIds_input": [cp1_id, cp3_id],
        "orderedPoints": [{"neighborhoodName": "Centro Cívico", "id": cp1_id}, {"neighborhoodName": "Shopping Flores", "id": cp3_id}],
        "orderedEdges": [], "totalDistanceKm": 25, "servicedResidueTypes": ["papel", "plástico", "metal"]
    })
    route2_id = str(uuid.uuid4())
    routes_db.append({
        "id": route2_id, "name": "Rota Sul-Ambiental", "truckId": truck2_id,
        "collectionPointIds_input": [cp2_id], # Apenas 1 para teste, mas a regra de criação exige 2
        "orderedPoints": [{"neighborhoodName": "Parque Ambiental", "id": cp2_id}],
        "orderedEdges": [], "totalDistanceKm": 15, "servicedResidueTypes": ["orgânico", "vidro"]
    })


    # Itinerários
    today_str = datetime.now().strftime('%Y-%m-%d')
    itineraries_db.append({"id": str(uuid.uuid4()), "routeId": route1_id, "truckId": truck1_id, "collectionDate": today_str})
    
    app.run(debug=True, port=5001) # Rodar em uma porta diferente do frontend (ex: 5001)

    print("Script iniciado!") # Adicione esta linha no começo
# ... todo o seu código existente ...
print("Script concluído!") # Adicione esta linha no final