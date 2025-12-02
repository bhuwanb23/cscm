import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ScrollView,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const ProductDetails = ({ item, isVisible, onClose }) => {
    const slideAnim = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        if (isVisible) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [isVisible, slideAnim]);

    if (!item) return null;

    const getStatusStyle = (status) => {
        switch (status) {
            case 'low':
                return { color: '#EF4444', bgColor: '#FEE2E2', textColor: '#DC2626', label: 'Low Stock' };
            case 'in-stock':
                return { color: '#22C55E', bgColor: '#D1FAE5', textColor: '#16A34A', label: 'In Stock' };
            case 'expiring':
                return { color: '#F97316', bgColor: '#FED7AA', textColor: '#EA580C', label: 'Expires Soon' };
            default:
                return { color: '#22C55E', bgColor: '#D1FAE5', textColor: '#16A34A', label: 'In Stock' };
        }
    };

    const statusStyle = getStatusStyle(item.status);

    return (
        <View style={styles.overlay} pointerEvents={isVisible ? 'auto' : 'none'}>
            <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
            <Animated.View
                style={[
                    styles.container,
                    {
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.badgeContainer}>
                            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bgColor }]}>
                                <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
                                    {statusStyle.label}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>SKU</Text>
                            <Text style={styles.value}>{item.sku}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Supplier</Text>
                            <Text style={styles.value}>{item.supplier}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Category</Text>
                            <Text style={styles.value}>{item.category}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Available Quantity</Text>
                            <Text style={[styles.value, { fontWeight: '700', color: statusStyle.color }]}>
                                {item.quantity} units
                            </Text>
                        </View>

                        {item.expiryDate && (
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Expiry Date</Text>
                                <Text style={[styles.value, { color: '#F97316' }]}>
                                    {item.expiryDate}
                                </Text>
                            </View>
                        )}

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Location</Text>
                            <Text style={styles.value}>{item.location}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Last Updated</Text>
                            <Text style={styles.value}>{item.lastUpdated}</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Product Details</Text>
                        <Text style={styles.description}>
                            {item.description}
                        </Text>

                        <View style={styles.specsContainer}>
                            <View style={styles.specRow}>
                                <Text style={styles.specLabel}>Price</Text>
                                <Text style={styles.specValue}>${item.price?.toFixed(2)}</Text>
                            </View>

                            <View style={styles.specRow}>
                                <Text style={styles.specLabel}>Cost</Text>
                                <Text style={styles.specValue}>${item.cost?.toFixed(2)}</Text>
                            </View>

                            <View style={styles.specRow}>
                                <Text style={styles.specLabel}>Weight</Text>
                                <Text style={styles.specValue}>{item.weight}</Text>
                            </View>

                            <View style={styles.specRow}>
                                <Text style={styles.specLabel}>Dimensions</Text>
                                <Text style={styles.specValue}>{item.dimensions}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Inventory History</Text>
                        <View style={styles.historyItem}>
                            <Text style={styles.historyDate}>Dec 1, 2023</Text>
                            <Text style={styles.historyAction}>Stock received: +50 units</Text>
                        </View>
                        <View style={styles.historyItem}>
                            <Text style={styles.historyDate}>Nov 28, 2023</Text>
                            <Text style={styles.historyAction}>Sales: -12 units</Text>
                        </View>
                        <View style={styles.historyItem}>
                            <Text style={styles.historyDate}>Nov 25, 2023</Text>
                            <Text style={styles.historyAction}>Stock received: +30 units</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Actions</Text>
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity style={styles.actionButton}>
                                <LinearGradient
                                    colors={['#3B82F6', '#2563EB']}
                                    style={styles.actionButtonGradient}
                                >
                                    <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                                    <Text style={styles.actionButtonText}>Edit Details</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton}>
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    style={styles.actionButtonGradient}
                                >
                                    <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                                    <Text style={styles.actionButtonText}>Add Stock</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton}>
                                <LinearGradient
                                    colors={['#F59E0B', '#D97706']}
                                    style={styles.actionButtonGradient}
                                >
                                    <Ionicons name="alert-circle-outline" size={20} color="#FFFFFF" />
                                    <Text style={styles.actionButtonText}>Report Issue</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        minHeight: height * 0.6,
        maxHeight: height * 0.8,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 10,
    },
    productName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        marginRight: 10,
    },
    closeButton: {
        padding: 5,
    },
    section: {
        marginBottom: 24,
    },
    badgeContainer: {
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    label: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    value: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 16,
    },
    specsContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
    },
    specRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    specLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    specValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '600',
    },
    historyItem: {
        marginBottom: 12,
    },
    historyDate: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 2,
    },
    historyAction: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    actionButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ProductDetails;