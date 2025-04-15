import { Text, View, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useState, useContext, useEffect } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function DriverSchedule() {
  const { userDetail } = useContext(UserDetailContext);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [viewMode, setViewMode] = useState("schedule");

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const user = userDetail?.email;
        if (!user) return;
        const availabilityRef = collection(db, "users", user, "availability");
        const querySnapshot = await getDocs(availabilityRef);
        const availabilityData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAvailability(availabilityData);
      } catch (error) {
        console.error("Error fetching availability:", error);
      }
    };
    fetchAvailability();
  }, [userDetail]);

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    const updatedDate = new Date(currentDate);
    updatedDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
    setDate(updatedDate);
  };

  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || date;
    setShowTimePicker(false);
    const updatedDate = new Date(date);
    updatedDate.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
    setDate(updatedDate);
  };

  const saveAvailability = async () => {
    try {
      const user = userDetail?.email;
      if (!user) return;
      const availabilityId = Date.now().toString();
      const newAvailability = {
        id: availabilityId,
        datetime: date.toISOString(),
        driver_id: userDetail?.uid,
      };
      const availabilityRef = doc(db, "users", user, "availability", availabilityId);
      await setDoc(availabilityRef, newAvailability);
      setAvailability([...availability, newAvailability]);
      setDate(new Date());
    } catch (error) {
      console.error("Error saving availability:", error);
    }
  };

  const renderAvailabilityItem = ({ item }) => (
    <View style={styles.availabilityItem}>
      <Text style={styles.availabilityText}>
        Available: {new Date(item.datetime).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {viewMode === "schedule" ? "Set Availability" : "Your Availability"}
      </Text>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setViewMode(viewMode === "schedule" ? "view" : "schedule")}
      >
        <Text style={styles.toggleText}>
          {viewMode === "schedule" ? "View Availability" : "Set New Availability"}
        </Text>
      </TouchableOpacity>
      {viewMode === "schedule" ? (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Availability Date & Time:</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateText}>
                  {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={date}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={saveAvailability}>
            <Text style={styles.submitText}>Save Availability</Text>
          </TouchableOpacity>
        </>
      ) : (
        <FlatList
          data={availability}
          renderItem={renderAvailabilityItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No availability set.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1e7d",
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "oswald-bold",
    textAlign: "center",
    marginBottom: 20,
  },
  toggleButton: {
    backgroundColor: "#f3400d",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  toggleText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  label: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 16,
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 300,
    gap: 10,
  },
  dateButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  timeButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  dateText: {
    fontFamily: "oswald-bold",
    color: "#0b1e7d",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#f3400d",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 18,
  },
  availabilityItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  availabilityText: {
    color: "#0b1e7d",
    fontFamily: "oswald-bold",
    fontSize: 14,
  },
  emptyText: {
    color: "#fff",
    fontFamily: "oswald-bold",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});