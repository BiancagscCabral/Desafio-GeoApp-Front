import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  View, 
  FlatList, 
  Image, 
  Alert, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import api from '../services/api';
import { Defeito } from '../types/Defeito';

export default function HomeScreen() {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('');
  const [laboratorio, setLaboratorio] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [defeitos, setDefeitos] = useState<Defeito[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Guardamos a localização exata para enviar ao banco (separado do texto)
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    carregarDefeitos();
  }, []);

  const carregarDefeitos = async () => {
    try {
      const response = await api.get('/defeitos');
      setDefeitos(response.data);
    } catch (error) {
      console.log("Erro ao carregar:", error);
    }
  };

  // --- NOVA LÓGICA DE GPS ---
  const obterLocalizacao = async () => {
    setGpsLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à localização.');
      setGpsLoading(false);
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      
      // AQUI ESTÁ A MÁGICA:
      // Pegamos o que já está escrito no local e adicionamos as coordenadas
      const coordsTexto = ` (Lat: ${loc.coords.latitude.toFixed(5)}, Long: ${loc.coords.longitude.toFixed(5)})`;
      setLocal((prevLocal) => prevLocal + coordsTexto);
      
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível pegar o GPS.');
    } finally {
      setGpsLoading(false);
    }
  };

  const tirarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos acesso à câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setFoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const salvarDefeito = async () => {
    if (!titulo || !local || !laboratorio) {
      Alert.alert('Campos vazios', 'Preencha Título, Local e Laboratório.');
      return;
    }

    setLoading(true);
    try {
      const novoDefeito = {
        titulo,
        descricao,
        local,
        laboratorio,
        foto,
        // envia as coordenadas numéricas para o banco (para futuros mapas)
        latitude: location?.coords.latitude,
        longitude: location?.coords.longitude,
      };

      const response = await api.post('/defeitos', novoDefeito);
      setDefeitos([response.data, ...defeitos]);
      
      setTitulo('');
      setDescricao('');
      setLocal('');
      setLaboratorio('');
      setFoto(null);
      setLocation(null);
      
      Alert.alert('Sucesso', 'Registro salvo!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.titulo}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.laboratorio}</Text>
        </View>
      </View>
      
      <Text style={styles.cardLocal}>📍 {item.local}</Text>
      
      {item.descricao ? <Text style={styles.cardDesc}>{item.descricao}</Text> : null}
      {item.foto && <Image source={{ uri: item.foto }} style={styles.cardImage} resizeMode="cover" />}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.mainTitle}>Sis<Text style={{color: '#0e7291ff'}}>Manutenção</Text></Text>
        
        <View style={styles.formContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Novo Reporte</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder="Título do Problema" 
              value={titulo} 
              onChangeText={setTitulo} 
            />
            
            <TextInput 
              style={styles.input} 
              placeholder="Nome do Local" 
              value={laboratorio} 
              onChangeText={setLaboratorio} 
            />

            {/* localização com botão de GPS embutido */}
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.inputFlex} 
                placeholder="Local exato" 
                value={local} 
                onChangeText={setLocal} 
              />
              <TouchableOpacity onPress={obterLocalizacao} style={styles.gpsIconBtn}>
                {gpsLoading ? (
                  <ActivityIndicator size="small" color="#4a90e2" />
                ) : (
                  <Text style={{fontSize: 20}}>📍</Text>
                )}
              </TouchableOpacity>
            </View>

            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Descreva o problema..." 
              value={descricao} 
              onChangeText={setDescricao} 
              multiline 
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.photoButton, foto ? styles.photoButtonActive : {}]} onPress={tirarFoto}>
                <Text style={styles.buttonText}>{foto ? "📸 Foto OK" : "Câmera"}</Text>
              </TouchableOpacity>
              {foto && <Image source={{ uri: foto }} style={styles.miniPreview} />}
            </View>

            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={salvarDefeito} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Salvar</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Histórico Recente</Text>
          <FlatList
            data={defeitos}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  container: {
    flex: 1,
    paddingTop: 40,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
    letterSpacing: -1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 15,
    marginLeft: 4,
  },
  formContainer: {
    maxHeight: '55%',
    paddingHorizontal: 20,
  },

  // inputs
  input: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    paddingRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  inputFlex: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
  },
  gpsIconBtn: {
    backgroundColor: '#F0F4F8',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  // botões
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  miniPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  photoButton: {
    backgroundColor: '#6c757d',
    flex: 1,
  },
  photoButtonActive: {
    backgroundColor: '#28a745',
  },
  saveButton: {
    backgroundColor: '#4a90e2',
    marginBottom: 20,
  },

  // lista e os cards
  listContainer: {
    flex: 1,
    backgroundColor: '#E9ECEF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  listContent: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#4a90e2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  badge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: '#4a90e2',
    fontSize: 12,
    fontWeight: '700',
  },
  cardLocal: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  cardDesc: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
});