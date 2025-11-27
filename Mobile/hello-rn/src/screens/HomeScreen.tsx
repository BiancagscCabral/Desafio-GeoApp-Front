import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, Button, FlatList, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { Defeito } from '../types/Defeito';

export default function HomeScreen() {
  // Estados do formulário
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('');
  const [laboratorio, setLaboratorio] = useState('');
  const [foto, setFoto] = useState<string | null>(null);

  // Estados da lista
  const [defeitos, setDefeitos] = useState<Defeito[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarDefeitos();
  }, []);

  const carregarDefeitos = async () => {
    try {
      const response = await api.get('/defeitos');
      setDefeitos(response.data);
    } catch (error) {
      console.log("Erro ao carregar (Backend pode estar offline):", error);
    }
  };

  const tirarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos acesso à câmera para registrar o defeito.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
      base64: true, // Importante para enviar ao backend
    });

    if (!result.canceled && result.assets[0].base64) {
      setFoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const salvarDefeito = async () => {
    if (!titulo || !local || !laboratorio) {
      Alert.alert('Campos vazios', 'Por favor, preencha Título, Local e Laboratório.');
      return;
    }

    setLoading(true);
    try {
      const novoDefeito: Defeito = {
        titulo,
        descricao,
        local,
        laboratorio,
        foto,
      };

      const response = await api.post('/defeitos', novoDefeito);
      
      // Adiciona na lista instantaneamente
      setDefeitos([response.data, ...defeitos]);
      
      // Limpa o formulário
      setTitulo('');
      setDescricao('');
      setLocal('');
      setLaboratorio('');
      setFoto(null);
      
      Alert.alert('Sucesso', 'Registro salvo com sucesso!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar. Verifique se o Backend está rodando e o IP está correto.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Defeito }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.titulo}</Text>
      <Text style={styles.cardSubtitle}>{item.laboratorio} - {item.local}</Text>
      <Text style={styles.cardDesc}>{item.descricao}</Text>
      {item.foto && (
        <Image source={{ uri: item.foto }} style={styles.cardImage} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Reporte de Manutenção 🛠️</Text>
      
      <ScrollView style={styles.formContainer}>
        <TextInput style={styles.input} placeholder="Título do Problema" value={titulo} onChangeText={setTitulo} />
        <TextInput style={styles.input} placeholder="Laboratório (Ex: Química)" value={laboratorio} onChangeText={setLaboratorio} />
        <TextInput style={styles.input} placeholder="Local (Ex: Bancada 2)" value={local} onChangeText={setLocal} />
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Descrição detalhada" 
          value={descricao} 
          onChangeText={setDescricao} 
          multiline 
        />

        <Button title={foto ? "Foto Registrada ✅" : "📷 Tirar Foto"} onPress={tirarFoto} color="#6200ee" />
        
        {foto && <Image source={{ uri: foto }} style={styles.previewImage} />}
        
        <View style={{ marginTop: 10 }}>
          <Button 
            title={loading ? "Salvando..." : "💾 Salvar Registro"} 
            onPress={salvarDefeito} 
            disabled={loading} 
            color="#03dac6"
          />
        </View>
      </ScrollView>

      <Text style={styles.listHeader}>Últimos Registros</Text>
      <FlatList
        data={defeitos}
        keyExtractor={(item) => item._id || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 50 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333' },
  formContainer: { paddingHorizontal: 20, maxHeight: 400 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
  textArea: { height: 80, textAlignVertical: 'top' },
  previewImage: { width: 100, height: 100, borderRadius: 10, alignSelf: 'center', marginVertical: 10 },
  listHeader: { fontSize: 20, fontWeight: 'bold', margin: 20, color: '#555' },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardSubtitle: { fontSize: 14, color: '#6200ee', marginBottom: 5, fontWeight: '600' },
  cardDesc: { color: '#666', marginBottom: 10 },
  cardImage: { width: '100%', height: 150, borderRadius: 8, marginTop: 5 },
});