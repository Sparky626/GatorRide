import { Text, View, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { useState, useContext, useEffect, useCallback } from "react";
import { UserDetailContext } from "@/context/UserDetailContext";
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import GooglePlacesInput from "../components/GooglePlacesInput";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import toastConfig from "../../config/toastConfig";

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
  const [refreshing, setRefreshing] = useState(false);

  const fetchScheduledRides = useCallback(async () => {
    try {
      const uid = userDetail?.uid;
      if (!uid) {
        console.log("Missing userDetail.uid");
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "User not found. Please sign in again.",
        });
        return;
      }

      console.log("Fetching scheduled rides for user:", uid);
      const ridesQuery = query(
        collection(db, "scheduled_rides"),
        where("user_id", "==", uid)
      );
      const ridesSnapshot = await getDocs(ridesQuery);
      const ridesList = ridesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Scheduled rides found:", ridesList);
      setScheduledRides(ridesList);
    } catch (error) {
      console.error("Error fetching scheduled rides:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load rides.",
      });
    }
  }, [userDetail]);

  useEffect(() => {
    fetchScheduledRides();
  }, [fetchScheduledRides]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchScheduledRides();
    setRefreshing(false);
  }, [fetchScheduledRides]);

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
      const email = userDetail?.email;
      if (!uid || !email) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "User not found.",
        });
        return;
      }

      if (!origin || !destination || !date) {
        Toast.show({
          type: "error",
          text1: "Missing Fields",
          text2: "Please fill in origin, destination, and date.",
        });
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
        rider_email: email,
        driver: {
          driver_id: "TBD",
          first_name: "Pending",
          last_name: "Driver",
          car_details: {
            car_image_url: "https://example.com/placeholder.png",
            seats: 5,
            gas_type: "regular",
            mpg: 25,
            license_plate: "TBD",
            capacity: 5,
            color: "Unknown",
            make: "Unknown",
            model: "Unknown",
            year: 0,
          },
          rating: "N/A",
        },
      };

      const rideRef = doc(db, "scheduled_rides", rideId);
      await setDoc(rideRef, newRide);
      console.log(`Ride ${rideId} scheduled for user ${uid}`);

      if (viewMode === "view") {
        setScheduledRides([...scheduledRides, { id: rideId, ...newRide }]);
      }

      Toast.show({
        type: "success",
        text1: "Ride Scheduled",
        text2: "Your ride has been added successfully.",
      });

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
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to schedule ride.",
      });
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
      <Text style={styles.rideText}>
        Driver: {item.driver_id === "TBD" ? "Pending" : item.driver.first_name + " " + item.driver.last_name}
      </Text>
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
              containerStyle={styles.roundedInput}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Destination:</Text>
            <GooglePlacesInput
              placeholder="Enter destination"
              onPlaceSelected={(description) => setDestination(description)}
              value={destination}
              containerStyle={styles.roundedInput}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#f3400d"
              colors={["#f3400d"]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No scheduled rides found.</Text>
          }
        />
      )}
      <Toast config={toastConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1e7d",
    paddingRight: 20,
    paddingLeft: 20,
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
  roundedInput: {
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#f3400d",
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: 300,
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