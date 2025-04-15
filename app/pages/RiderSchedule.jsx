import { Text, View, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useState, useContext, useEffect } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import GooglePlacesInput from "../components/GooglePlacesInput";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function RiderSchedule() {
  const { userDetail } = useContext(UserDetailContext);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false,
  });
  const [repeat, setRepeat] = useState("Once");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [scheduledRides, setScheduledRides] = useState([]);
  const [viewMode, setViewMode] = useState("schedule");

  useEffect(() => {
    const fetchScheduledRides = async () => {
      try {
        const uid = userDetail?.uid;
        const user = userDetail?.email;
        if (!user) return;

        const ridesRef = collection(db, "users", user, "scheduled_rides");
        const ridesSnapshot = await getDocs(ridesRef);
        const ridesList = ridesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setScheduledRides(ridesList);
      } catch (error) {
        console.error("Error fetching scheduled rides:", error);
      }
    };

    fetchScheduledRides();
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

  const toggleDay = (day) => {
    setSelectedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };
  const repeatOptions = ["Once", "Weekly", "Monthly"];
  const daysOfWeek = Object.keys(selectedDays);

  const scheduleRide = async () => {
    try {
      const uid = userDetail?.uid;
      const user = userDetail?.email;
      if (!user) {
        console.log("No user available");
        return;
      }

      if (!origin || !destination || !date) {
        console.log("Please fill in all required fields (Origin, Destination, Date & Time)");
        return;
      }

      const rideId = Date.now().toString();
      const scheduledDays = daysOfWeek.filter((day) => selectedDays[day]);

      const newRide = {
        ride_id: rideId,
        origin: origin,
        destination: destination,
        scheduled_datetime: date.toISOString(),
        scheduled_days: repeat === "Weekly" ? scheduledDays : [],
        repeat: repeat,
        driver_id: "TBD",
        user_id: uid,
        driver: {
          driver_id: "TBD",
          first_name: "Pending",
          last_name: "Driver",
          car_image_url: "https://example.com/placeholder.png",
          car_seats: 5,
          car_gas: "regular",
          mpg: 25,
          rating: "N/A",
        },
      };

      const userRef = doc(db, "users", user);
      await setDoc(
        userRef,
        {
          email: userDetail?.email || "unknown",
          name: userDetail?.name || "Unknown User",
          uid: uid,
        },
        { merge: true }
      );

      const rideRef = doc(db, "users", user, "scheduled_rides", rideId);
      await setDoc(rideRef, newRide);
      console.log(`Ride ${rideId} scheduled for user ${uid}`);
      console.log("Saved Ride Data:", newRide);

      const ridesRef = collection(db, "users", user, "scheduled_rides");
      const ridesSnapshot = await getDocs(ridesRef);
      const ridesList = ridesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setScheduledRides(ridesList);

      setOrigin("");
      setDestination("");
      setDate(new Date());
      setSelectedDays({
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false,
        Sunday: false,
      });
      setRepeat("Once");
      setViewMode("view");
    } catch (error) {
      console.error("Error scheduling ride:", error);
    }
  };

  const renderRideItem = ({ item }) => (
    <View style={styles.rideItem}>
      <Text style={styles.rideText}>Origin: {item.origin}</Text>
      <Text style={styles.rideText}>Destination: {item.destination}</Text>
      <Text style={styles.rideText}>
        Date: {new Date(item.scheduled_datetime).toLocaleString()}
      </Text>
      <Text style={styles.rideText}>Repeat: {item.repeat}</Text>
      {item.repeat === "Weekly" && item.scheduled_days.length > 0 && (
        <Text style={styles.rideText}>
          Days: {item.scheduled_days.join(", ")}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {viewMode === "schedule" ? "Schedule Your Ride" : "Your Scheduled Rides"}
      </Text>

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setViewMode(viewMode === "schedule" ? "view" : "schedule")}
      >
        <Text style={styles.toggleText}>
          {viewMode === "schedule" ? "View Scheduled Rides" : "Schedule a New Ride"}
        </Text>
      </TouchableOpacity>

      {viewMode === "schedule" ? (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Origin:</Text>
            <GooglePlacesInput
              placeholder="Enter starting location"
              onPlaceSelected={(description) => setOrigin(description)}
              value={origin}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Destination:</Text>
            <GooglePlacesInput
              placeholder="Enter destination"
              onPlaceSelected={(description) => setDestination(description)}
              value={destination}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Start Date & Time:</Text>
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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Select Days:</Text>
            <View style={styles.daysContainer}>
              {daysOfWeek.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    selectedDays[day] && styles.dayButtonActive,
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      selectedDays[day] && styles.dayTextActive,
                    ]}
                  >
                    {day.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Repeat:</Text>
            <View style={styles.repeatContainer}>
              {repeatOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.repeatButton,
                    repeat === option && styles.repeatButtonActive,
                  ]}
                  onPress={() => setRepeat(option)}
                >
                  <Text
                    style={[
                      styles.repeatText,
                      repeat === option && styles.repeatTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={scheduleRide}>
            <Text style={styles.submitText}>Schedule Ride</Text>
          </TouchableOpacity>
        </>
      ) : (
        <FlatList
          data={scheduledRides}
          renderItem={renderRideItem}
          keyExtractor={(item) => item.ride_id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No scheduled rides found.</Text>
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
    marginTop: 50,
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
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  dayButton: {
    width: 60,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    alignItems: "center",
  },
  dayButtonActive: {
    backgroundColor: "#f3400d",
  },
  dayText: {
    fontFamily: "oswald-bold",
    color: "#0b1e7d",
    fontSize: 14,
  },
  dayTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  repeatContainer: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  repeatButton: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
  },
  repeatButtonActive: {
    backgroundColor: "#f3400d",
  },
  repeatText: {
    fontFamily: "oswald-bold",
    color: "#0b1e7d",
  },
  repeatTextActive: {
    color: "#fff",
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
  rideItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  rideText: {
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